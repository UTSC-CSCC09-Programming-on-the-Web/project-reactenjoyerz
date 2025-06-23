import pool from "./database/index.js";

async function resetDB() {
  try {
    await pool.query(
      "TRUNCATE TABLE users, subscriptions, payments RESTART IDENTITY CASCADE;"
    );
    console.log("Database reset.");
    process.exit(0);
  } catch (err) {
    console.error("Reset failed:", err);
    process.exit(1);
  }
}

resetDB();
