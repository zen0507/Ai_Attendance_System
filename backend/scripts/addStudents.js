const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const Student = require('../models/Student');

const STUDENTS_NAMES = [
    "AADHIL ANTONY", "REVATHIMOL S", "GOPIKA GOPAKUMAR", "P HARIDEV", "ANASWAR . K . R",
    "SREEHARI S NAIR", "ALAN LAWRENCE", "SREELAKSHMI K M", "ARAVIND U K", "MIDHUN MATHEW",
    "MUHAMMED FAHED", "JOYAL KUNJUMON", "TINTO THOMAS", "REVATHI T", "FARHANA M",
    "NEENU JOSEPH", "DEVIKA S", "ZEN VARGHESE", "MUHAMMED ALTHAF . R", "ALAN MUHAMMAD N",
    "ADHITHYAN . A", "ALTHAF A", "ABHINAV P K", "ADARSH S BABU", "CHRISTEL PETER K JOSEPH",
    "ADHITHIAN T S", "ARAVIND S KUMAR", "AIBEL JACOB", "ROHITH KRISHNA", "K B RIFA",
    "FARZANA M", "ARDRA V K", "ALEX VARGHESE", "ANSHAD K N", "ARUNIMA S NATH",
    "NANDHANA KRISHNA S", "ANSOODH K S", "SAGAR SURESH", "KRISHNA MUKESH",
    "ANOOP ASHOKAN", "ABHIRAM . N . B", "MIDHUN P S", "SIVADEV S.S", "NISHAD. N"
];

const DEPARTMENT = "Bachelor of Computer Application";
const BATCH = "2023-2026";
const SEMESTER = "S1";
const DEFAULT_PASSWORD = "password123";

const generateEmail = (name) => {
    // Remove dots, spaces, special chars and lower case
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${cleanName}@bca.com`;
};

const addStudents = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB. Processing ${STUDENTS_NAMES.length} students...`);

        let addedCount = 0;
        let skippedCount = 0;

        for (const name of STUDENTS_NAMES) {
            const email = generateEmail(name);

            try {
                // 1. Check if User exists
                const userExists = await User.findOne({ email });
                if (userExists) {
                    console.log(`Skipping existing user: ${name} (${email})`);
                    skippedCount++;
                    continue;
                }

                // 2. Create User
                const user = await User.create({
                    name: name,
                    email: email,
                    password: DEFAULT_PASSWORD,
                    role: 'student',
                    status: 'active',
                });

                // 3. Create Student Profile
                await Student.create({
                    userId: user._id,
                    department: DEPARTMENT,
                    batch: BATCH,
                    semester: SEMESTER,
                    startDate: new Date('2023-07-01'),
                    endDate: new Date('2026-07-01')
                });

                console.log(`Added: ${name} (${email})`);
                addedCount++;

            } catch (err) {
                console.error(`Failed to add ${name}:`, err.message);
            }
        }

        console.log(`\nOperation Complete.`);
        console.log(`Added: ${addedCount}`);
        console.log(`Skipped: ${skippedCount}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

addStudents();
