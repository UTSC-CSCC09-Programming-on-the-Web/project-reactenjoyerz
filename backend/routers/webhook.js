import { Router, raw } from "express";
import stripe from "../stripe/index.js";
import pool from "../database/index.js";

export const webhookRouter = Router();

webhookRouter.post("/", raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const subscriptionId = session.subscription;
      const customerId = session.customer;

      if (!subscriptionId) {
        console.error("Missing subscription ID in checkout.session.completed");
        return res.status(400).send();
      }

      let userId;
      try {
        const customer = await stripe.customers.retrieve(customerId);
        userId = parseInt(customer.metadata.userId, 10);
      } catch (err) {
        console.error("Failed to retrieve customer metadata", err);
        return res.status(500).send();
      }

      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const { rows } = await pool.query(
          `INSERT INTO subscriptions
         (user_id, stripe_sub_id, status, current_period_end)
       VALUES ($1, $2, $3, to_timestamp($4))
       ON CONFLICT (stripe_sub_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         current_period_end = EXCLUDED.current_period_end
       RETURNING id`,
          [userId, subscriptionId, sub.status, sub.current_period_end]
        );

        const subscriptionDbId = rows[0].id;

        await pool.query(
          `INSERT INTO payments
         (subscription_id, stripe_invoice_id, amount_paid, currency, paid_at)
       VALUES ($1, $2, $3, $4, to_timestamp($5))
       ON CONFLICT (stripe_invoice_id) DO NOTHING`,
          [
            subscriptionDbId,
            session.invoice, // if available
            sub.latest_invoice?.amount_paid || 0,
            sub.latest_invoice?.currency || "usd",
            Math.floor(Date.now() / 1000),
          ]
        );
      } catch (err) {
        console.error("Database insert failed:", err);
        return res.status(500).send();
      }

      break;
    }

    case "customer.subscription.deleted":
    case "customer.subscription.updated": {
      const subscription = event.data.object;
      try {
        await pool.query(
          `UPDATE subscriptions
             SET status = $1,
                 current_period_end = to_timestamp($2)
             WHERE stripe_sub_id = $3`,
          [
            subscription.status,
            subscription.current_period_end,
            subscription.id,
          ]
        );
      } catch (err) {
        console.error("Subscription status update failed", err);
        return res.status(500).send();
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});
