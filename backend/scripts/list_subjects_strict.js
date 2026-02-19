const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Subject = require('../models/Subject');

const debug = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendanceDB');
        console.log('Connected to DB');

        const subjects = await Subject.find({});
        console.log(`Found ${subjects.length} subjects.`);

        subjects.forEach(s => {
            console.log(`\nName: "${s.name}"`);
            console.log(`Name chars: ${[...s.name].map(c => c.charCodeAt(0)).join(',')}`);
            console.log(`ID: ${s._id}`);
            console.log(`Batch: "${s.batch}"`);
            console.log(`Sem: "${s.semester}"`);
        });

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debug();
