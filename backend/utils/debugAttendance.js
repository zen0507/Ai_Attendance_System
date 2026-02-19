const mongoose = require('mongoose');
const Subject = require('../models/Subject');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

const debugAttendance = async (payload, userId) => {
    console.log("----------------------------------------------------------------");
    console.log("DEBUG ATTENDANCE SUBMISSION");
    console.log("----------------------------------------------------------------");
    console.log("User ID:", userId);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    try {
        if (!payload.subjectId) throw new Error("Missing subjectId");

        const subject = await Subject.findById(payload.subjectId);
        if (!subject) console.log("ERROR: Subject NOT FOUND:", payload.subjectId);
        else {
            console.log("Subject Found:", subject.name);
            console.log("Subject Sem:", subject.semester);
            console.log("Subject Dept:", subject.department);
        }

        // Simulate Creation
        const sessionData = {
            subjectId: payload.subjectId,
            teacherId: userId,
            department: subject ? subject.department : "UNKNOWN",
            batch: payload.batch,
            semester: subject ? subject.semester : "UNKNOWN",
            date: new Date(),
            hoursConducted: payload.hours
        };
        console.log("Session Data to Create:", sessionData);

        return "Debug check complete.";
    } catch (e) {
        console.log("DEBUG ERROR:", e.message);
        return e.message;
    }
};

module.exports = debugAttendance;
