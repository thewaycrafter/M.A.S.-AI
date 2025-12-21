
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User';

dotenv.config({ path: '../.env' });

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string, {
            dbName: process.env.MONGODB_DATABASE || 'singhal-ai'
        });
        console.log('🔌 Connected to MongoDB');

        // Check collections
        const collections = await mongoose.connection.db!.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        console.log('\n👥 User List:');
        console.table(users.map(u => ({
            ID: u._id.toString(),
            Username: u.username,
            Email: u.email,
            Role: u.role,
            Tier: u.subscription?.tier || 'free',
            Joined: u.createdAt
        })));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listUsers();
