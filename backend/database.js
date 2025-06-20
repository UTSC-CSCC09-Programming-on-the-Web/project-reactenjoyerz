import dotenv from 'dotenv';
import { Pool } from 'pg'
dotenv.config();

// Documentation: https://node-postgres.com/apis/pool , https://node-postgres.com/apis/client
const pool = new Pool({
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    database: process.env.PGDATABASE,
});

pool.connect().then(() => console.log('connected to database'));

export default pool;