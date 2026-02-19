const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const setMainAdmin = async () => {
    const email = process.argv[2];

    if (!email) {
        console.error('Please provide an email address. Usage: node scripts/setMainAdmin.js <email>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.isMainAdmin = true;
        // Ensure they are also an admin
        if (user.role !== 'admin') {
            user.role = 'admin';
            console.log(`User ${email} promoted to admin role.`);
        }

        await user.save();
        console.log(`SUCCESS: ${email} is now a Main Admin.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

setMainAdmin();
