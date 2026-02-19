const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/models/User');
const Student = require('./backend/models/Student');

dotenv.config({ path: './backend/.env' });

const checkIntegrity = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendanceDB');
        console.log('Connected to DB');

        const students = await User.find({ role: 'student' });
        console.log(`Found ${students.length} users with role 'student'`);

        for (const s of students) {
            const profile = await Student.findOne({ userId: s._id });
            console.log(`User: ${s.email} (${s.name}) -> Profile: ${profile ? profile._id : 'MISSING ❌'}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
};

checkIntegrity();
