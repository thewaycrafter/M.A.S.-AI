
import { Client } from 'pg';
import config from '../config';

async function createDatabase() {
    console.log('🔌 Connecting to default postgres database...');

    // Connect to 'postgres' database to execute CREATE DATABASE command
    const client = new Client({
        host: config.postgres.host,
        port: config.postgres.port,
        user: config.postgres.user,
        password: config.postgres.password,
        database: 'postgres', // Connect to default DB
    });

    try {
        await client.connect();
        console.log('✅ Connected to postgres database');

        const dbName = config.postgres.database;

        // Check if database exists
        const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);

        if (res.rowCount === 0) {
            console.log(`✨ Database '${dbName}' does not exist. Creating...`);
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database '${dbName}' created successfully`);
        } else {
            console.log(`ℹ️  Database '${dbName}' already exists`);
        }
    } catch (error) {
        console.error('❌ Error creating database:', error);
    } finally {
        await client.end();
        console.log('🔌 Connection closed');
    }
}

createDatabase();
