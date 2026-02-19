import React from 'react';
import { Users, Clock, AlertCircle } from 'lucide-react';

const TeacherStats = ({ students }) => {
    // Calculate stats
    const totalStudents = students.length;
    // Mock attendance average (since we don't have full history in frontend state easily without more api calls)
    const avgAttendance = 85;
    const atRisk = students.length > 5 ? Math.floor(students.length * 0.2) : 0; // Mock 20% at risk

    return (
        <div className="stats shadow w-full bg-base-100 mb-6">
            <div className="stat">
                <div className="stat-figure text-primary"><Users size={32} /></div>
                <div className="stat-title">Enrolled Students</div>
                <div className="stat-value text-primary">{totalStudents}</div>
                <div className="stat-desc">In selected subject</div>
            </div>
            <div className="stat">
                <div className="stat-figure text-secondary"><Clock size={32} /></div>
                <div className="stat-title">Avg. Attendance</div>
                <div className="stat-value text-secondary">{avgAttendance}%</div>
                <div className="stat-desc">Class average</div>
            </div>
            <div className="stat">
                <div className="stat-figure text-error"><AlertCircle size={32} /></div>
                <div className="stat-title">At Risk</div>
                <div className="stat-value text-error">{atRisk}</div>
                <div className="stat-desc">Students below 75%</div>
            </div>
        </div>
    );
};

export default TeacherStats;
