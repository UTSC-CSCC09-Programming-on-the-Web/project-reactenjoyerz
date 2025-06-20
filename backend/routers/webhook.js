// routers/webhook.js
import { Router } from "express";
import stripe from "../stripe/index.js";
import pool from "../database/index.js";

const router = Router();

/**
 * Stripe webhook handler
 * Listens for invoice.payment_succeeded (and logs other events)
 */
router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;

      // Retrieve the Stripe customer to get your userId metadata
      let userId;
      try {
        const customer = await stripe.customers.retrieve(customerId);
        userId = parseInt(customer.metadata.userId, 10);
      } catch (err) {
        console.error("Failed to retrieve customer metadata", err);
        return res.status(500).send();
      }

      try {
        // Upsert (insert or update) subscription record
        const { rows } = await pool.query(
          `INSERT INTO subscriptions
             (user_id, stripe_sub_id, status, current_period_end)
           VALUES ($1, $2, $3, to_timestamp($4))
           ON CONFLICT (stripe_sub_id)
           DO UPDATE SET
             status = EXCLUDED.status,
             current_period_end = EXCLUDED.current_period_end
           RETURNING id`,
          [
            userId,
            subscriptionId,
            invoice.status,
            invoice.lines.data[0].period.end,
          ]
        );
        const subscriptionDbId = rows[0].id;

        // Log the payment
        await pool.query(
          `INSERT INTO payments
             (subscription_id, stripe_invoice_id, amount_paid, currency, paid_at)
           VALUES ($1, $2, $3, $4, to_timestamp($5))
           ON CONFLICT (stripe_invoice_id) DO NOTHING`,
          [
            subscriptionDbId,
            invoice.id,
            invoice.amount_paid,
            invoice.currency,
            invoice.status_transitions.paid_at,
          ]
        );
      } catch (err) {
        console.error("Database error logging payment/subscription", err);
        return res.status(500).send();
      }

      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

export default router;
