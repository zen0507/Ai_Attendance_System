const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');

const listAdmins = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const admins = await User.find({ role: 'admin' }, 'name email role status isMainAdmin');
        console.log('Admins found:', admins);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

listAdmins();
