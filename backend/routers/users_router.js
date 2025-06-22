import { Router } from "express";
import pool from "../database/index.js";
import bcrypt from "bcryptjs";
import stripe from "../stripe/index.js";

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

    console.log("Customer_ID IS ", customer.id);

    await pool.query(
      "INSERT INTO users (email, username, password, stripe_customer_id) VALUES ($1, $2, $3, $4)",
      [email, username, hashedPassword, customer.id]
    );

    return res.status(200).json();
  } catch (error) {
    console.error(error);
    return res.status(500);
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

    return res
      .status(200)
      .json({ id: user.rows[0].id, email: user.rows[0].email });
  } catch (error) {
    console.error(error);
    return res.status(500);
  }
});
