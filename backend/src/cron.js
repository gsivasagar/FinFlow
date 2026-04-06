const cron = require('node-cron');
const { getDB } = require('./config/database');

// Run this job every day at midnight (00:00) server time
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 0 * * *', () => {
    console.log('[Cron] Starting recurring transactions processing...');
    
    try {
    const db = getDB();
    const today = new Date().toISOString().split('T')[0];

    // Find all active recurring transactions scheduled for today or earlier
    const transactions = db.prepare(
      `SELECT * FROM recurring_transactions WHERE is_active = 1 AND next_run_date <= ?`
    ).all(today);

    if (transactions.length === 0) {
      console.log('[Cron] No recurring transactions to process today.');
      return;
    }

    db.transaction(() => {
      let insertedCount = 0;
      for (const t of transactions) {
        // Insert into financial_records
        db.prepare(`
          INSERT INTO financial_records (amount, type, category, date, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(t.amount, t.type, t.category, t.next_run_date, t.notes || 'Auto-generated recurring transaction', t.user_id);
        
        insertedCount++;

        // Calculate next run date
        const nextRun = new Date(t.next_run_date);
        switch (t.frequency) {
          case 'daily':
            nextRun.setDate(nextRun.getDate() + 1);
            break;
          case 'weekly':
            nextRun.setDate(nextRun.getDate() + 7);
            break;
          case 'monthly':
            nextRun.setMonth(nextRun.getMonth() + 1);
            break;
          case 'yearly':
            nextRun.setFullYear(nextRun.getFullYear() + 1);
            break;
        }

        const nextRunStr = nextRun.toISOString().split('T')[0];

        // Update the recurring transaction's next_run_date
        db.prepare(`UPDATE recurring_transactions SET next_run_date = ? WHERE id = ?`).run(nextRunStr, t.id);
      }
      console.log(`[Cron] Processed ${insertedCount} recurring transactions.`);
    })();
  } catch (err) {
    console.error('[Cron] Error processing recurring transactions:', err);
  }
});
}
