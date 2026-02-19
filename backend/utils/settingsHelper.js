const User = require('../models/User');

const DEFAULTS = {
    minAttendance: 75,
    passMarks: 20,
    weightage: { test1: 0.3, test2: 0.3, assignment: 0.4 },
    emailAlerts: true,
    smsAlerts: false
};

/**
 * Get logic settings from the first teacher user's profile,
 * falling back to DEFAULTS if not found.
 * @returns {Object} { minAttendance, passMarks, weightage: { test1, test2, assignment } }
 */
const getLogicSettings = async () => {
    try {
        const teacher = await User.findOne({ role: 'teacher' }).select('settings').lean();
        if (!teacher || !teacher.settings) return { ...DEFAULTS };

        const s = teacher.settings;
        const w = s.weightage || DEFAULTS.weightage;

        // Auto-correct: if weights don't sum to ~1.0, fall back to defaults
        const wSum = (Number(w.test1) || 0) + (Number(w.test2) || 0) + (Number(w.assignment) || 0);
        const safeWeightage = Math.abs(wSum - 1.0) > 0.05 ? DEFAULTS.weightage : {
            test1: Number(w.test1) || 0.3,
            test2: Number(w.test2) || 0.3,
            assignment: Number(w.assignment) || 0.4
        };

        return {
            minAttendance: Number(s.minAttendance) || DEFAULTS.minAttendance,
            passMarks: Number(s.passMarks) || DEFAULTS.passMarks,
            weightage: safeWeightage,
            emailAlerts: s.emailAlerts ?? DEFAULTS.emailAlerts,
            smsAlerts: s.smsAlerts ?? DEFAULTS.smsAlerts
        };
    } catch (err) {
        console.error('[settingsHelper] Error fetching settings, using defaults:', err.message);
        return { ...DEFAULTS };
    }
};

module.exports = { getLogicSettings, DEFAULTS };
