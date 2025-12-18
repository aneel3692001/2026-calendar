import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'db', 'calendar.db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload dir exists
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
  fs.mkdirSync(path.join(__dirname, 'uploads'));
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// DB Connection Helper
async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

// Routes

// 1. Get Calendar Month
// Returns days for the month with events and featured image info
app.get('/api/calendar/:year/:month', async (req, res) => {
  const { year, month } = req.params; // Month is 1-12
  const start = `${year}-${month.toString().padStart(2, '0')}-01`;
  const end = `${year}-${month.toString().padStart(2, '0')}-31`; // Loose end date

  const db = await getDb();
  
  // Get Events
  const events = await db.all(
    `SELECT * FROM events WHERE date BETWEEN ? AND ?`,
    start, end
  );

  // Get Featured Images (Calendar Assignments)
  const assignments = await db.all(
    `SELECT ca.date, ca.submission_id, s.image_web_url, s.caption_optional, p.name as photographer_name, p.instagram_username
     FROM calendar_assignments ca
     JOIN submissions s ON ca.submission_id = s.id
     JOIN photographers p ON s.photographer_id = p.id
     WHERE ca.date BETWEEN ? AND ?`,
    start, end
  );

  res.json({ year, month, events, assignments });
});

// 2. Get Day Details
app.get('/api/day/:date', async (req, res) => {
  const { date } = req.params;
  const db = await getDb();

  const events = await db.all(`SELECT * FROM events WHERE date = ?`, date);
  const assignment = await db.get(
    `SELECT ca.*, s.image_web_url, s.image_original_url, s.caption_optional, p.name, p.instagram_username
     FROM calendar_assignments ca
     JOIN submissions s ON ca.submission_id = s.id
     JOIN photographers p ON s.photographer_id = p.id
     WHERE ca.date = ?`,
    date
  );

  res.json({ date, events, assignment });
});

// 3. Public Submit
app.post('/api/submit', upload.single('image'), async (req, res) => {
  try {
    const { name, instagram_username, email, caption } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No image uploaded' });

    const db = await getDb();
    
    // Find or Create Photographer
    let photographer = await db.get(`SELECT id FROM photographers WHERE email = ?`, email);
    if (!photographer) {
      const result = await db.run(
        `INSERT INTO photographers (name, instagram_username, email) VALUES (?, ?, ?)`,
        name, instagram_username, email
      );
      photographer = { id: result.lastID };
    }

    // Create Submission
    // Note: In a real app we would use Sharp here to optimize image_web_url
    // For now, we just point to the uploaded file relative path
    const webUrl = `/uploads/${file.filename}`;
    
    await db.run(
      `INSERT INTO submissions (photographer_id, image_original_url, image_web_url, caption_optional, status)
       VALUES (?, ?, ?, ?, 'pending')`,
      photographer.id, webUrl, webUrl, caption
    );

    res.json({ success: true, message: 'Submission received' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Routes would go here (Login, List Submissions, Approve, Assign)

import { initScheduler } from './services/cron.js';
initScheduler();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
