import { Router } from "express";
import pool from "../database/index.js";
import bcrypt from "bcryptjs";
import stripe from "../stripe/index.js";

export const usersRouter = Router();

usersRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const emailExists = await pool.query(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );
    if (emailExists.rows.length != 0) {
      return res.status(400).json({ error: "email already exists" });
    }

    const usernameExists = await pool.query(
      'SELECT * FROM "User" WHERE username = $1',
      [username]
    );
    if (usernameExists.rows.length != 0) {
      return res.status(400).json({ error: "username already exists " });
    }

    const customer = await stripe.customers.create({
      email,
      name: username,
      metadata: {
        username,
        email,
      },
    });

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = await pool.query(
      'INSERT INTO "User" (email, username, password, stripe_customer_id) VALUES ($1, $2, $3, $4) RETURNING id, email, username',
      [email, username, hashedPassword, customer.id]
    );

    req.session.userId = user.rows[0].id;
    return res.status(200).json({
      id: user.rows[0].id,
      email: user.rows[0].email,
      username: user.rows[0].username,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

usersRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM "User" WHERE email = $1', [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: "No such email" });
    }

    const hashedPassword = user.rows[0].password;
    const isSame = await bcrypt.compare(password, hashedPassword);
    if (!isSame) {
      return res.status(400).json({ error: "wrong password" });
    }

    // Check for active subscription
    const subQ = await pool.query(
      `SELECT 1
       FROM subscriptions
       WHERE user_id = $1
         AND status = 'active'
         AND current_period_end > now()`,
      [user.rows[0].id]
    );

    if (!subQ.rows.length) {
      return res.status(402).json({
        error: "Subscription required. Please subscribe to continue.",
      });
    }

    req.session.userId = user.rows[0].id;
    return res.status(200).json({
      id: user.rows[0].id,
      email: user.rows[0].email,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

usersRouter.get("/logout", (req, res) => {
  req.session.destroy();
  return res.json({ message: "Signed out." });
});

usersRouter.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ errors: "Not authenticated" });
  }
  return res.json({ userId: req.session.userId });
});