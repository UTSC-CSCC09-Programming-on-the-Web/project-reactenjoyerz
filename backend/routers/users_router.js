import { Router } from "express";
import pool from "../database/index.js";
import bcrypt from "bcryptjs";
import stripe from "../stripe/index.js";

import { OAuth2Client } from "google-auth-library";
import assert from "node:assert";

import { bindToken, findToken, deleteToken } from "../token.js";

const googleClient = new OAuth2Client(
  "796814869937-0qjv66bls0u5nkgstqdjhvl4tojf42hg.apps.googleusercontent.com"
);

export const usersRouter = Router();

usersRouter.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const emailExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (emailExists.rows.length != 0) {
      return res.status(400).json({ error: "email already exists" });
    }

    const usernameExists = await pool.query(
      "SELECT * FROM users WHERE username = $1",
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
      "INSERT INTO users (email, username, password, stripe_customer_id) VALUES ($1, $2, $3, $4) RETURNING id, email, username",
      [email, username, hashedPassword, customer.id]
    );

    const userId =  user.rows[0].id;

    assert(findToken(userId) === undefined);
    const token = bindToken(user.rows[0].id, username);

    return res.status(200).json({
      id: user.rows[0].id,
      email: user.rows[0].email,
      username: user.rows[0].username,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

usersRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
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
      console.warn("no subscription");
    }

    const userId =  user.rows[0].id;
    const token = bindToken(userId, user.rows[0].username);
    console.log(user.rows[0].username);

    return res.status(200).json({
      id: user.rows[0].id,
      email: user.rows[0].email,
      has_subscription: subQ.rows.length !== 0,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

usersRouter.post("/google-login", async (req, res) => {
  const { idToken } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience:
        "796814869937-0qjv66bls0u5nkgstqdjhvl4tojf42hg.apps.googleusercontent.com",
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || email;

    let userExists = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    let user;
    if (userExists.rows.length === 0) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          email,
          username: name,
        },
      });
      const insertUser = await pool.query(
        `INSERT INTO users (email, username, stripe_customer_id, password)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [email, name, customer.id, "to satisfy not null"]
      );

      user = insertUser.rows[0];
    } else {
      user = userExists.rows[0];
    }

    // Check for active subscription
    const subQ = await pool.query(
      `SELECT 1
       FROM subscriptions
       WHERE user_id = $1
         AND status = 'active'
         AND current_period_end > now()`,
      [user.id]
    );

    const userId = user.id;
    const token = bindToken(userId, name);

    return res.status(200).json({
      id: user.id,
      email: user.email,
      hasSubscription: subQ.rows.length !== 0,
      token,
      isGoogle: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid Google login" });
  }
});

usersRouter.post("/logout", (req, res) => {
  if (req.body !== undefined) {
    deleteToken(req.body.token);
    return res.json({ message: "Signed out." });
  } 
});
