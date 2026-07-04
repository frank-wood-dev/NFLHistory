require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function getTeamId(teamName) {
  const existingTeam = await pool.query(
    'SELECT id FROM team WHERE team_name = $1',
    [teamName],
  );

  if (existingTeam.rows.length > 0) {
    return existingTeam.rows[0].id;
  }

  const newTeam = await pool.query(
    'INSERT INTO team (team_name) VALUES ($1) RETURNING id',
    [teamName],
  );

  return newTeam.rows[0].id;
}

async function upsertGame(game) {
  const result = await pool.query(
    `
    INSERT INTO game (
      season,
      week_type,
      date_played,
      home_team_id,
      away_team_id,
      home_team_score,
      away_team_score,
      location_marker,
      home_team_yards_gained,
      away_team_yards_gained,
      home_team_turnovers,
      away_team_turnovers
    )
    VALUES (
      $1, $2, $3, $4, $5, $6,
      $7, $8, $9, $10, $11, $12
    )
    ON CONFLICT (season, week_type, date_played, home_team_id, away_team_id)
    DO UPDATE SET
      home_team_score = EXCLUDED.home_team_score,
      away_team_score = EXCLUDED.away_team_score,
      location_marker = EXCLUDED.location_marker,
      home_team_yards_gained = EXCLUDED.home_team_yards_gained,
      away_team_yards_gained = EXCLUDED.away_team_yards_gained,
      home_team_turnovers = EXCLUDED.home_team_turnovers,
      away_team_turnovers = EXCLUDED.away_team_turnovers
    RETURNING id
    `,
    [
      game.season,
      game.weekType,
      game.datePlayed,
      game.homeTeamId,
      game.awayTeamId,
      game.homeTeamPoints,
      game.awayTeamPoints,
      game.locationIndicator,
      game.homeTeamYardsGained,
      game.awayTeamYardsGained,
      game.homeTeamTurnovers,
      game.awayTeamTurnovers,
    ],
  );

  return result.rows[0].id;
}

module.exports = {
  getTeamId,
  upsertGame,
};
