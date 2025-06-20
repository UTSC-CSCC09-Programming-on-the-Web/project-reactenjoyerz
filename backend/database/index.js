import dotenv from "dotenv";
import { Pool } from "pg";
dotenv.config();

// Documentation: https://node-postgres.com/apis/pool , https://node-postgres.com/apis/client
const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
});

async function initSchema() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("subscriptions & payments tables ensured");
}

pool
  .connect()
  .then(() => {
    console.log("connected to database");
    return initSchema();
  })
  .catch((err) => {
    console.error("DB connection/init failed", err);
    process.exit(1);
  });

export default pool;
