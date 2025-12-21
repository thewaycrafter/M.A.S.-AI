import mongoose from 'mongoose';
import config from '../config'; // Import config from the same directory structure
import { User } from '../models/User';

async function checkAdminUser() {
    try {
        console.log('Connecting to MongoDB at:', config.mongodb.uri);
        await mongoose.connect(config.mongodb.uri);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username: 'msadmin' });

        if (user) {
            console.log('Found msadmin user:');
            console.log('ID:', user._id);
            console.log('Email:', user.email);
            console.log('Role:', user.role);
            console.log('Subscription:', user.subscription);
        } else {
            console.log('User "msadmin" NOT found!');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        if (mongoose.connection.readyState === 1) await mongoose.disconnect();
    }
}

checkAdminUser();
