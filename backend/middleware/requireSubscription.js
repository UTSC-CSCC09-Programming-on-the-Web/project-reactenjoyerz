import pool from "../database/index.js";

export const requireSubscription = async (req, res, next) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const subQ = await pool.query(
    `SELECT 1 FROM subscriptions
     WHERE user_id = $1
       AND status = 'active'
       AND current_period_end > now()`,
    [userId]
  );

  if (!subQ.rows.length) {
    return res.status(402).json({
      error: "Subscription required. Please subscribe to continue.",
    });
  }

  next();
};
