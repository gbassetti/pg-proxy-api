require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

const TARGET_SCHEMA = "training_peaks";

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.get("/tables", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `, [TARGET_SCHEMA]);
    res.json(result.rows);
  } catch (e) {
    console.error("Error fetching tables:", e);
    res.status(500).json({ error: "Failed to fetch tables" });
  }
});

app.get("/table/:name/schema", async (req, res) => {
  const table = req.params.name;
  try {
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = $1
        AND table_name = $2;
    `, [TARGET_SCHEMA, table]);
    res.json(result.rows);
  } catch (e) {
    console.error("Error fetching schema:", e);
    res.status(500).json({ error: "Failed to fetch schema" });
  }
});

app.get("/table/:name/sample", async (req, res) => {
  const table = req.params.name;
  try {
    const result = await pool.query(`SELECT * FROM "\${TARGET_SCHEMA}"."\${table}" LIMIT 5;\`);
    res.json(result.rows);
  } catch (e) {
    console.error("Error fetching sample data:", e);
    res.status(500).json({ error: "Failed to fetch sample data" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API running at http://localhost:\${PORT}\`);
});
