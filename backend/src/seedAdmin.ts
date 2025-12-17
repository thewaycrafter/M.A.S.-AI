// Script to create the admin user
import mongoose from 'mongoose';
import { User } from './models/User';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';

async function createAdminUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existing = await User.findOne({ username: 'mridul' });
        if (existing) {
            console.log('Admin user already exists');
            await mongoose.disconnect();
            return;
        }

        // Create admin user
        const admin = new User({
            username: 'mridul',
            email: 'admin@aegis-ai.com',
            password: '12111211', // Match user requirement but meet 8 char minimum
            role: 'admin',
            subscription: {
                tier: 'enterprise',
                status: 'active',
                startDate: new Date(),
            },
            profile: {
                firstName: 'Mridul',
                lastName: 'Admin',
            },
        });

        await admin.save();
        console.log('✅ Admin user created successfully');
        console.log('Username: mridul');
        console.log('Password: 12111211');

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error creating admin user:', error);
        process.exit(1);
    }
}

createAdminUser();
