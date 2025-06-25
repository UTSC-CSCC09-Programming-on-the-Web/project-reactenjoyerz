import { Router } from "express";
import pool from "../database/index.js";
import bcrypt from "bcryptjs";
import stripe from "../stripe/index.js";

import { OAuth2Client } from "google-auth-library";
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
      console.log("error");
      return res.status(402).json({
        error: "Subscription required. Please subscribe to continue.",
      });
    }

    console.log("good");
    req.session.userId = user.rows[0].id;
    return res.status(200).json({
      id: user.rows[0].id,
      email: user.rows[0].email,
      has_subscription: true,
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

    if (!subQ.rows.length) {
      return res.status(402).json({
        error: "Subscription required. Please subscribe to continue.",
      });
    }

    req.session.userId = user.id;

    return res.status(200).json({
      id: user.id,
      email: user.email,
      has_subscription: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(401).json({ error: "Invalid Google login" });
  }
});

usersRouter.get("/logout", (req, res) => {
  req.session.destroy();
  return res.json({ message: "Signed out." });
});

usersRouter.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ errors: "Not authenticated" });
  }
  const userId = req.session.userId;

  const userQ = await pool.query("SELECT id, email FROM users WHERE id = $1", [
    userId,
  ]);

  if (!userQ.rows.length) {
    return res.status(404).json({ error: "User not found" });
  }

  const subQ = await pool.query(
    `SELECT 1
     FROM subscriptions
     WHERE user_id = $1
       AND status = 'active'
       AND current_period_end > now()`,
    [userId]
  );

  return res.json({
    id: userQ.rows[0].id,
    email: userQ.rows[0].email,
    has_subscription: subQ.rows.length > 0,
  });
});
