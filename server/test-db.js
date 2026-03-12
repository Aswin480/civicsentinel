import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'civicsentinel',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
});

pool.query('SELECT * FROM grievances ORDER BY timestamp DESC')
    .then(res => {
        console.log('Query successful, row count:', res.rowCount);
        process.exit(0);
    })
    .catch(err => {
        console.error('Database query failed:', err.message);
        process.exit(1);
    });
