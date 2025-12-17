import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { User } from './models/User';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis';

async function testLogin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const user: any = await User.findOne({ username: 'mridul' });

        if (!user) {
            console.log('❌ User not found');
            await mongoose.disconnect();
            return;
        }

        console.log('✅ User found:', user.username);
        console.log('Stored password hash:', user.password);

        // Test password comparison
        const password = '12111211';
        const isValid = await bcrypt.compare(password, user.password);

        console.log('\nPassword test:');
        console.log('Input password:', password);
        console.log('Comparison result:', isValid);

        if (isValid) {
            console.log('✅ Password matches!');
        } else {
            console.log('❌ Password does not match!');

            // Try hashing the password to see what it should be
            const newHash = await bcrypt.hash(password, 10);
            console.log('\nExpected hash for "12111211":', newHash);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testLogin();
