const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const Student = require('../models/Student');

const assignRollNumbers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendanceDB');
        console.log('Connected to DB');

        // 1. Fetch Users sorted alphabetically
        // We filter by role 'student' and the target batch (to be safe)
        const users = await User.find({
            role: 'student',
            batch: '2023-2026'
        }).sort({ name: 1 });

        console.log(`Found ${users.length} students in batch 2023-2026.`);

        let count = 0;
        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            const rollNo = i + 1;

            // 2. Find Student Profile and Update
            const student = await Student.findOne({ userId: user._id });

            if (student) {
                student.rollNumber = rollNo;
                await student.save();
                console.log(`${rollNo}. ${user.name} -> Assigned Roll No: ${rollNo}`);
                count++;
            } else {
                console.log(`WARNING: No Student profile for ${user.name}`);
            }
        }

        console.log(`\nSuccessfully assigned roll numbers to ${count} students.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

assignRollNumbers();
