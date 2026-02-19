const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const checkMainAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const mainAdmin = await User.findOne({ isMainAdmin: true });
        if (mainAdmin) {
            console.log(`Main Admin exists: ${mainAdmin.email}`);
        } else {
            console.log('No Main Admin found.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

checkMainAdmin();
