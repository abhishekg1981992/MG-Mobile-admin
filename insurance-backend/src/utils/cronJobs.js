import cron from 'node-cron';
import pool from '../config/db.js';

export function scheduleRenewalJob() {
  // Run daily at 09:00
  cron.schedule('0 9 * * *', async () => {
    try {
      const [rows] = await pool.query("SELECT r.*, p.policy_number, c.email FROM renewals r JOIN policies p ON r.policy_id=p.id JOIN clients c ON p.client_id=c.id WHERE r.renewal_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND r.status='pending'");
      if (rows.length>0) {
        console.log('Found renewals due in next 7 days:', rows.length);
        // In production, call email service to notify clients/admins
      }
    } catch (e) {
      console.error('Renewal cron job failed', e);
    }
  }, { timezone: 'Asia/Kuala_Lumpur' });
}
