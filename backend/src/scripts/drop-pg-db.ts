
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dropPostgresDb = async () => {
    // Connect to specific database or default 'postgres' to drop others
    const client = new Client({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        user: process.env.POSTGRES_USER || 'singhalmridul',
        password: process.env.POSTGRES_PASSWORD,
        database: 'postgres', // Connect to default DB to drop others
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL default DB');

        const dbName = 'singhal_audit';

        // Terminate existing connections
        await client.query(`
            SELECT pg_terminate_backend(pg_stat_activity.pid)
            FROM pg_stat_activity
            WHERE pg_stat_activity.datname = '${dbName}'
            AND pid <> pg_backend_pid();
        `);
        console.log(`Terminated connections to ${dbName}`);

        // Drop Database
        await client.query(`DROP DATABASE IF EXISTS "${dbName}";`);
        console.log(`Dropped database: ${dbName}`);

    } catch (err) {
        console.error('Error dropping Postgres DB:', err);
    } finally {
        await client.end();
    }
};

dropPostgresDb();
