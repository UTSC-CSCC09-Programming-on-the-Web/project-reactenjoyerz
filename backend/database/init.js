// database/init.js
import fs from "fs";
import path from "path";
import pool from "./index.js";

export async function initDB() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("Database schema ensured");
}
