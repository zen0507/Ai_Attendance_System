const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Student = require('./models/Student');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const connectDB = require('./config/db');

dotenv.config();

const seedData = async () => {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('Data already exists, skipping seed.');
            return;
        }

        console.log('Seeding Data...');

        // Create Admin
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'password123',
            role: 'admin',
        });

        console.log('Admin Created: admin@example.com / password123');

        // Create a demo Teacher
        const teacherUser = await User.create({
            name: 'John Doe Teacher',
            email: 'teacher@example.com',
            password: 'password123',
            role: 'teacher'
        });

        const teacherProfile = await Teacher.create({
            userId: teacherUser._id,
            subjectsAssigned: []
        });

        // Create a demo Subject
        const subject = await Subject.create({
            name: 'Introduction to AI',
            teacherId: teacherProfile._id
        });

        // Update teacher with subject
        teacherProfile.subjectsAssigned.push(subject._id);
        await teacherProfile.save();

        console.log('Teacher Created: teacher@example.com / password123');

        // Create a demo Student
        const studentUser = await User.create({
            name: 'Jane Doe Student',
            email: 'student@example.com',
            password: 'password123',
            role: 'student'
        });

        await Student.create({
            userId: studentUser._id,
            batch: '2024',
            semester: '5'
        });

        console.log('Student Created: student@example.com / password123');
        console.log('Data Imported!');

    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

module.exports = seedData;
