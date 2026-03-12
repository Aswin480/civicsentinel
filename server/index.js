import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// PostgreSQL Pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'civicsentinel',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Ensure uploads directory exists
import fs from 'fs';
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Routes

// Get all grievances
app.get('/api/grievances', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM grievances ORDER BY timestamp DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Create a new grievance
app.post('/api/grievances', async (req, res) => {
    try {
        const {
            id, userName, type, category, status, description,
            timestamp, evidenceUrl, votes, replies, location, aiAnalysis
        } = req.body;

        const newGrievance = await pool.query(
            `INSERT INTO grievances (
                id, user_name, type, category, status, description, 
                timestamp, evidence_url, votes, replies, location, ai_analysis
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
            [
                id, userName, type, category, status, description,
                timestamp, evidenceUrl, votes, replies ? JSON.stringify(replies) : '[]', 
                location ? JSON.stringify(location) : '{}', 
                aiAnalysis ? JSON.stringify(aiAnalysis) : '{}'
            ]
        );

        res.json(newGrievance.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Upload evidence
app.post('/api/upload', upload.single('evidence'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    const publicUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({ publicUrl });
});

// Update grievance status
app.put('/api/grievances/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const updateGrievance = await pool.query(
            'UPDATE grievances SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(updateGrievance.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Toggle vote on grievance (increment by 1 for simplicity)
app.put('/api/grievances/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'UPDATE grievances SET votes = votes + 1 WHERE id = $1 RETURNING *',
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Add reply
app.put('/api/grievances/:id/reply', async (req, res) => {
    try {
        const { id } = req.params;
        const { newReply } = req.body; // Expects an object { id, sender, message, timestamp }
        
        // Fetch current replies
        const grievance = await pool.query('SELECT replies FROM grievances WHERE id = $1', [id]);
        let currentReplies = grievance.rows[0].replies || [];
        if (typeof currentReplies === 'string') currentReplies = JSON.parse(currentReplies);
        
        currentReplies.push(newReply);
        
        const updateGrievance = await pool.query(
            'UPDATE grievances SET replies = $1 WHERE id = $2 RETURNING *',
            [JSON.stringify(currentReplies), id]
        );
        res.json(updateGrievance.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
