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

module.exports = {
  pool,
  getTeamId,
};
