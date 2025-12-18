import cron from 'node-cron';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../db', 'calendar.db');

export function initScheduler() {
  // Run every day at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily notification job...');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    
    // Get today's assignment
    const today = new Date().toISOString().split('T')[0];
    const assignment = await db.get(`
        SELECT s.id, p.email, p.instagram_username
        FROM calendar_assignments ca
        JOIN submissions s ON ca.submission_id = s.id
        JOIN photographers p ON s.photographer_id = p.id
        WHERE ca.date = ?
    `, today);

    if (assignment) {
        console.log(`Found featured photo for ${today} by ${assignment.email}`);
        // 1. Generate Screenshot (Stub)
        // await generateScreenshot(today);
        
        // 2. Send Email (Stub)
        // await sendEmail(assignment.email, ...);
        
        // 3. Log
        await db.run(`INSERT INTO notifications_log (date, photographer_id, channel, status, details_json) VALUES (?, ?, ?, ?, ?)`,
            today, assignment.id, 'email', 'queued', JSON.stringify({ msg: 'Cron triggered' })
        );
    } else {
        console.log('No featured photo for today.');
    }
  });
}
