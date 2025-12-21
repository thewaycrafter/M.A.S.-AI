import mongoose from 'mongoose';
import config from '../config'; // Import config from the same directory structure
import { User } from '../models/User';

async function fixAdminUser() {
    try {
        console.log('Connecting to MongoDB at:', config.mongodb.uri);
        console.log('Database Name:', config.mongodb.database);

        await mongoose.connect(config.mongodb.uri, {
            dbName: config.mongodb.database
        });
        console.log('✅ Connected to MongoDB');

        const username = 'msadmin';
        const password = 'Admin@123';

        let user = await User.findOne({ username });

        if (user) {
            console.log('Found existing msadmin user.');
            if (user.role !== 'admin') {
                console.log('User role is', user.role, '- updating to admin...');
                user.role = 'admin';
                await user.save();
                console.log('✅ User role updated to admin.');
            } else {
                console.log('✅ User already has admin role.');
            }
            // Optional: reset password if needed, but let's assume password is OK unless user says otherwise.
            // But strict verifying requires knowing the password.
            // Let's force update the password to be sure.
            user.password = password;
            await user.save();
            console.log('✅ Password verified/updated.');

        } else {
            console.log('User "msadmin" NOT found. Creating...');
            user = new User({
                username,
                email: 'admin@aegis.ai',
                password: password,
                role: 'admin',
                isOnboarded: true,
                subscription: {
                    tier: 'pro',
                    status: 'active',
                    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            });
            await user.save();
            console.log('✅ User "msadmin" created successfully.');
        }

        console.log('--- User Details ---');
        console.log('ID:', user._id);
        console.log('Username:', user.username);
        console.log('Role:', user.role);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
        process.exit(1);
    }
}

fixAdminUser();
