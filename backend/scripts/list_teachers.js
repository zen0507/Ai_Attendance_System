const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const connectDB = require('../config/db');

dotenv.config();
connectDB();

const logFile = path.join(__dirname, '..', 'debug_teachers.txt');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
};

const listTeachers = async () => {
    try {
        if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
        log('--- List of Teachers ---');

        const teachers = await User.find({ role: 'teacher' });
        log(`Found ${teachers.length} teachers:`);

        teachers.forEach(t => {
            log(`- ${t.name} (${t.email}) ID: ${t._id}`);
        });

        process.exit();
    } catch (error) {
        log('Error: ' + error);
        process.exit(1);
    }
};

listTeachers();
