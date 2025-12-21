import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aegis-ai';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function verifyAuthBlocking() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create a Test User
        const testEmail = `testuser_${Date.now()}@example.com`;
        const testUser = new User({
            username: 'test_block_user',
            email: testEmail,
            password: 'Password123!',
            role: 'user',
            isOnboarded: true
        });

        await testUser.save();
        console.log(`Test user created: ${testUser._id}`);

        // Generate Token
        // NOTE: Ensure your JWT payload structure matches what your middleware expects!
        const token = jwt.sign({ id: testUser._id, role: testUser.role }, JWT_SECRET, { expiresIn: '1h' });

        // 2. Attempt Unauthorized Scan
        const target = 'unauthorized-target.com';
        console.log(`Attempting scan on ${target} without authorization...`);

        // Use native fetch (Node 18+)
        const response = await fetch('http://localhost:3001/api/scans/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ target })
        });

        const data: any = await response.json();

        console.log(`Response Status: ${response.status}`);
        // console.log('Response Body:', data);

        if (response.status === 403 && data.requiresAuthorization) {
            console.log('✅ PASS: Unauthorized scan was blocked with 403 and requiresAuthorization flag.');
        } else {
            console.error('❌ FAIL: Unauthorized scan was NOT blocked correctly.');
            console.log('Got status:', response.status);
            console.log('Got data:', data);
        }

        // Cleanup
        await User.findByIdAndDelete(testUser._id);
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('Verification Error:', error);
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
        process.exit(1);
    }
}

verifyAuthBlocking();
