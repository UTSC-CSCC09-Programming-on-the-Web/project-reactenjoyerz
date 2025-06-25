import stripe from "./stripe/index.js";
import pool from "./database/index.js";

async function syncSubscriptions() {
  const customers = await stripe.customers.list({ limit: 100 });

  for (const customer of customers.data) {
    const userId = parseInt(customer.metadata.userId, 10);
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
    });

    for (const sub of subscriptions.data) {
      const invoice = sub.latest_invoice
        ? await stripe.invoices.retrieve(sub.latest_invoice)
        : null;

      const periodEnd = sub.current_period_end;

      // Upsert subscription
      await pool.query(
        `INSERT INTO subscriptions (user_id, stripe_sub_id, status, current_period_end)
         VALUES ($1, $2, $3, to_timestamp($4))
         ON CONFLICT (stripe_sub_id)
         DO UPDATE SET status = EXCLUDED.status, current_period_end = EXCLUDED.current_period_end`,
        [userId, sub.id, sub.status, periodEnd]
      );

      if (invoice) {
        const rows = await pool.query(
          `SELECT id FROM subscriptions WHERE stripe_sub_id = $1`,
          [sub.id]
        );
        const subId = rows.rows[0].id;

        await pool.query(
          `INSERT INTO payments (subscription_id, stripe_invoice_id, amount_paid, currency, paid_at)
           VALUES ($1, $2, $3, $4, to_timestamp($5))
           ON CONFLICT (stripe_invoice_id) DO NOTHING`,
          [
            subId,
            invoice.id,
            invoice.amount_paid,
            invoice.currency,
            invoice.status_transitions.paid_at,
          ]
        );
      }
    }
  }

  console.log("Sync complete");
}

syncSubscriptions().catch(console.error);
