var GameStateEnum = {
  NotStarted: 1,
  InProgress: 2,
  Completed: 3,
};

function shouldShowExpandIfOnGamePage()
{
  chrome.tabs.query({
    active: true,
    currentWindow: true
  }, ([currentTab]) => {

    if(!currentTab.url.includes('ss=watch#'))
    {
      document.querySelector("#currentVideoOptions").remove();
      //document.querySelector("#currentVideoOptions").style["visibility"] = "hidden";
    }
  });
}

function scrollCalendar(days)
{
  // Read the currently set date
  var currentSelectedDate = document.querySelector("#scoreboardDate").innerHTML;

  var dateA = new Date(currentSelectedDate).getTime() + (days * 86400000);
  
  var nextDate = new Date(dateA);

  loadScoreboard(dateA);
}

function loadScoreboard(scoreboardDate)
{
  if(scoreboardDate == null)
  {
    scoreboardDate = Date();
  }

  var dateA = new Date(scoreboardDate);
  var monthFormated = ("0" + "" + (dateA.getMonth()+1)).slice(-2);
  var dayFormated = ("0" + "" + (dateA.getDate())).slice(-2);
  var dateFormatted = dateA.getFullYear() +""+ monthFormated + "" + dayFormated;
  var dateDisplayFormatted = monthFormated + "/" + dayFormated + "/" + dateA.getFullYear();

  document.querySelector("#scoreboardDate").innerHTML = dateDisplayFormatted;

  var http = new XMLHttpRequest();
  const scoreboardUrl = "https://data.nba.net/prod/v2/"+dateFormatted+"/scoreboard.json"; //TODO: Format Date

  http.onreadystatechange = function() {
    if(this.readyState == 4 && this.status == 200) {
      // Update Scoreboard
      var sb = JSON.parse(this.responseText);

      var sbString = ' \
        <div class="divTable"> \
          <div class="divTableBody"> ';

      if(sb.games.length == 0)
      {
        sbString += '<div class="divTableRow"><div class="divTableCell">No games</div></div>';
      }

      for(var g = 0; g < sb.games.length; g++)
      {
        var gameState = sb.games[g].statusNum;
      
        // set the default value
        var timeString = sb.games[g].startTimeEastern;
        var watchString = "";

        var scoreHClass ="";
        var scoreVClass ="";

        var scoreH = sb.games[g].hTeam.score;
        var scoreV = sb.games[g].vTeam.score;

        if(gameState === GameStateEnum.NotStarted)
        {
          scoreH = "";
          scoreV = "";
        }
        else if(gameState === GameStateEnum.InProgress)
        {
          if(sb.games[g].period.isHalftime)
          {
            timeString = "Halftime";
          } else if ( sb.games[g].period.isEndOfPeriod)  {
            timeString = "End of Q" + sb.games[g].period.current;
          } else {
            timeString = "Q" + sb.games[g].period.current +" "+ sb.games[g].clock;
          }

          if(sb.games[g].watch.broadcast.video.isLeaguePass)
          {
            watchString = '<span class="watchLive"><a href="https://www.nba.com/games/' +dateFormatted+ '/' + sb.games[g].vTeam.triCode + sb.games[g].hTeam.triCode +'?ss=watch#/matchup">LP</a></span>';
          }
        }
        else if(gameState === GameStateEnum.Completed)
        {
          timeString = '<a href="https://www.nba.com/games/' +dateFormatted+ '/' + sb.games[g].vTeam.triCode + sb.games[g].hTeam.triCode +'?ss=watch#/matchup">Final</a>';
        }

        if(sb.games[g].hTeam.score == sb.games[g].vTeam.score)
        {
          //tie
          var scoreHClass = "scoreTie";
          var scoreVClass = "scoreTie";
        } else if (sb.games[g].hTeam.score > sb.games[g].vTeam.score)
        {
          //home winning
          var scoreHClass = "scoreWinning";
          var scoreVClass = "scoreLosing";
        } else if (sb.games[g].hTeam.score < sb.games[g].vTeam.score)
        {
          //visitor winning
          var scoreHClass = "scoreLosing";
          var scoreVClass = "scoreWinning";
        }
        
        sbString += ' \
          <div class="divTableRow"> \
            <div class="divTableCell">\
              <span class="'+scoreVClass+'">\
              <img src="https://cdn.nba.net/assets/logos/teams/secondary/web/'+sb.games[g].vTeam.triCode+'.svg" />\
              <span class="vertical-align">'+scoreV+'</span></div> \
              </span>\
            <div class="divTableCell"> \
              <span class="'+scoreHClass+'">\
              <img src="https://cdn.nba.net/assets/logos/teams/secondary/web/'+sb.games[g].hTeam.triCode+'.svg" />\
              <span class="vertical-align">'+scoreH+'</span>\
              </span>\
            </div> \
            <div class="divTableCell timeInGame">'+timeString+'</div> \
            <div class="divTableCell">'+watchString+'</div> \
          </div>';
      }

      sbString += ' \
          </div> \
        </div>';

      document.querySelector("#scoreboard").innerHTML = sbString;
    }
  }

  http.open("GET", scoreboardUrl, true);
  http.send();
}

scoreboardDatePrevious.onclick = function(element)
{
  scrollCalendar(-1);
}

scoreboardDateNext.onclick = function(element)
{
  scrollCalendar(1);
}

expandVideo.onclick = function(element) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {
          code: ' \
            document.body.style.backgroundColor = "#000000"; \
            if(document.querySelector("div#lpHtml5Container") != null) \
            { \
              document.querySelector("div#lpHtml5Container").style["position"] = "fixed"; \
              document.querySelector("div#lpHtml5Container").style["top"] = 0; \
              document.querySelector("div#lpHtml5Container").style["left"] = 0; \
            } \
            document.querySelector("nav.nba-nav.nba-primary-nav").style["visibility"] = "hidden"; \
            document.querySelector("section#main").style["visibility"] = "hidden"; \
            document.querySelector("div#lpHtml5Container"); '
        }
      );
  });
};

window.addEventListener('click',function(e){
  if(e.target.href!==undefined && !e.target.href.includes("javascript:")){
    chrome.tabs.create({url:e.target.href})
  }
})

shouldShowExpandIfOnGamePage();

loadScoreboard();