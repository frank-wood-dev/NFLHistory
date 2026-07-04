const { getTeamId } = require('./db');

async function parseRecord(data, season) {
  const weekType = getWeekType(data);

  if (weekType === null) {
    return null;
  }

  const datePlayed = parseDatePlayed(data);
  const gameResult = await parseGameResult(data, season);

  return {
    weekType,
    datePlayed,
    season,
    ...gameResult,
  };
}

async function parseGameResult(data, season) {
  /*
    Week,Day,Date,Time,Winner/tie,LocationIndicator,Loser/tie,,WinnerPts,LoserPts,YdsW,TOW,YdsL,TOL
    1,Sat,1966-09-10,,Green Bay Packers,,Baltimore Colts,boxscore,24,3,292,1,213,3
    1,Sun,1966-09-11,,Los Angeles Rams,@,Atlanta Falcons,boxscore,19,14,421,2,237,2
  
  
    home_team_score INTEGER NOT NULL,
    away_team_score INTEGER NOT NULL,

    home_team_yards_gained INTEGER NOT NULL,
    away_team_yards_gained INTEGER NOT NULL,

    home_team_turnovers INTEGER NOT NULL,
    away_team_turnovers INTEGER NOT NULL,

  WinnerPts: '27',
    LoserPts: '7',
    YdsW: '423',
    TOW: '3',
    YdsL: '220',
    TOL: '1'    
  */

  const winningTeam = data['Winner/tie'];
  const losingTeam = data['Loser/tie'];

  if (!winningTeam || !losingTeam) {
    throw new Error('Cannot determine team name(s).');
  }

  const locationIndicator = getLocationIndicator(data.LocationIndicator);
  let homeTeamId = 0;
  let awayTeamId = 0;
  let homeTeamPoints = 0;
  let awayTeamPoints = 0;
  let homeTeamYardsGained = 0;
  let awayTeamYardsGained = 0;
  let homeTeamTurnovers = 0;
  let awayTeamTurnovers = 0;

  if (locationIndicator === 'S') {
    awayTeamId = await getTeamId(winningTeam);
    homeTeamId = await getTeamId(losingTeam);

    awayTeamPoints = parseInt(data.WinnerPts);
    homeTeamPoints = parseInt(data.LoserPts);

    awayTeamYardsGained = parseInt(data.YdsW);
    homeTeamYardsGained = parseInt(data.YdsL);

    awayTeamTurnovers = parseInt(data.TOW);
    homeTeamTurnovers = parseInt(data.TOL);
  } else {
    awayTeamId = await getTeamId(losingTeam);
    homeTeamId = await getTeamId(winningTeam);

    awayTeamPoints = parseInt(data.LoserPts);
    homeTeamPoints = parseInt(data.WinnerPts);

    awayTeamYardsGained = parseInt(data.YdsL);
    homeTeamYardsGained = parseInt(data.YdsW);

    awayTeamTurnovers = parseInt(data.TOL);
    homeTeamTurnovers = parseInt(data.TOW);
  }

  if (!awayTeamId || !homeTeamId) {
    throw new Error("Could NOT get team id's!");
  }

  return {
    locationIndicator,
    homeTeamId,
    awayTeamId,
    homeTeamPoints,
    awayTeamPoints,
    homeTeamYardsGained,
    awayTeamYardsGained,
    homeTeamTurnovers,
    awayTeamTurnovers,
  };
}

function getLocationIndicator(locInd) {
  let locationIndicator = '';

  switch (locInd) {
    case '':
    case '@':
      locationIndicator = 'S';

      break;

    case 'N':
      locationIndicator = locInd;

      break;

    default:
      break;
  }

  if (!locationIndicator) {
    throw new Error(
      'Invalid or unknown location indicator found: (' + locInd + ').',
    );
  }

  return locationIndicator;
}

function parseDatePlayed(data) {
  const dateValue = data?.Date;
  const timeValue = data?.Time;

  if (!isValidDate(dateValue)) {
    throw new Error('Invalid date found in data file: (' + dateValue + ').');
  }

  if (!timeValue) {
    return new Date(dateValue + 'T00:00:00');
  }

  const normalizedTime = normalizeTime(timeValue);

  return new Date(dateValue + 'T' + normalizedTime);
}

function isValidDate(dateValue) {
  if (!dateValue) {
    return false;
  }

  return /^\d{4}-\d{2}-\d{2}$/.test(dateValue);
}

function normalizeTime(timeValue) {
  const match = String(timeValue)
    .trim()
    .match(/^(\d{1,2}):(\d{2})(AM|PM)$/i);

  if (!match) {
    throw new Error('Unexpected time format found: (' + timeValue + ').');
  }

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const meridiem = match[3].toUpperCase();

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12;
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0;
  }

  return String(hours).padStart(2, '0') + ':' + minutes + ':00';
}

function getWeekType(data) {
  const weekValue = data?.Week;

  console.log('weekValue:', weekValue);

  if (!weekValue) {
    return null;
  }

  const weekInd = weekValue.toUpperCase();
  const week = parseInt(weekInd, 10);
  let weekType = 'REG'; //default
  //('REG', 'WC', 'DIV', 'CONF', 'SB')),

  console.log('weekInd:', weekInd);

  if (!week) {
    switch (weekInd) {
      case 'WILDCARD':
        weekType = 'WC';

        break;

      case 'DIVISION':
        weekType = 'DIV';

        break;

      case 'CHAMP':
      case 'CONFCHAMP':
        weekType = 'CONF';

        break;

      case 'SUPERBOWL':
        weekType = 'SB';

        break;

      default:
        throw new Error('Unexpected week indicator found: (' + weekInd + ').');
    }
  }

  return weekType;
}

module.exports = {
  parseRecord,
};
