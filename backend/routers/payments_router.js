import { Router } from "express";
import stripe from "../stripe/index.js";
import pool from "../database/index.js";
import { findPlayerInfo } from "../token.js";

import assert from "node:assert";

export const paymentsRouter = Router();

paymentsRouter.post("/create-subscription", async (req, res) => {
  const token = findPlayerInfo(req.body.token);

  if (!token) return res.status(400).json({ error: "Missing token" });
  const userId = token.userId;
  assert(userId !== undefined);

  try {
    // 1) Create (or retrieve) a Stripe Customer
    const customer = await stripe.customers.create({
      metadata: { userId: String(userId) },
    });

    // 2) Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customer.id,
      line_items: [{ price: process.env.PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Error creating subscription session:", err);
    res.status(500).json({ error: "Unable to create Stripe session" });
  }
});
