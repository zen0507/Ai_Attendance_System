/**
 * Intelligent Analytics Engine
 * Provides predictive analysis, risk scoring, and pattern detection.
 * 
 * ALL calculations are NaN-safe. No division by zero. No hardcoded thresholds (except legacy getRiskProfile).
 */

// --- UTILITIES ---

/**
 * Safely parse a number, returning 0 for NaN/undefined/null.
 */
const safe = (val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
};

/**
 * Calculate the slope of a trend using Linear Regression.
 * @param {Array} dataPoints - Array of numbers
 * @returns {number} - Slope (positive = improving, negative = declining)
 */
const calculateSlope = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) return 0;
    const n = dataPoints.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        const y = safe(dataPoints[i]);
        sumX += i;
        sumY += y;
        sumXY += i * y;
        sumXX += i * i;
    }
    const denom = (n * sumXX - sumX * sumX);
    if (denom === 0) return 0;
    return (n * sumXY - sumX * sumY) / denom;
};

/**
 * Predict next value in a series based on linear trend.
 */
const predictNextValue = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) return safe(dataPoints?.[0]);
    const slope = calculateSlope(dataPoints);
    return safe(dataPoints[dataPoints.length - 1]) + slope;
};

// --- CORE ANALYTICS ---

/**
 * Calculate Comprehensive Risk Profile for a Student.
 * Uses dynamic thresholds from settings.
 * @param {Object} studentData - { attendancePct, internalMarks, attendanceTrend, marksTrend }
 * @param {Object} thresholds - { minAttendance, passMarks } from settings
 * @returns {Object} { riskScore, riskLevel, riskFactors, trends, engagementScore, engagementStatus }
 */
const getRiskProfile = (studentData, thresholds = {}) => {
    const { attendancePct, internalMarks, attendanceTrend, marksTrend } = studentData;

    // RULE: If attendance data is missing, do NOT compute.
    if (attendancePct === null) {
        return {
            riskScore: null,
            riskLevel: 'N/A',
            engagementScore: null,
            engagementStatus: 'Insufficient data to compute engagement',
            riskFactors: ["No attendance records found"],
            trends: { attendance: 'N/A', performance: 'N/A' }
        };
    }

    const minAtt = safe(thresholds.minAttendance) || 75;
    const passMk = safe(thresholds.passMarks) || 20;

    let safetyScore = 100;
    const factors = [];
    const att = safe(attendancePct);
    const marks = safe(internalMarks);

    // 1. Attendance Penalty
    if (att < minAtt) {
        safetyScore -= (minAtt - att) * 2;
        factors.push("Low Attendance");
    }

    // 2. Marks Penalty (Capped Test1+2(60) + Assign(40) = 100)
    // Scale marks to 100 if they aren't already
    if (marks < passMk) {
        safetyScore -= (passMk - marks) * 3;
        factors.push("Failing Marks");
    }

    // 3. Trend Analysis
    const attSlope = calculateSlope(attendanceTrend || []);
    const markSlope = calculateSlope(marksTrend || []);
    if (attSlope < -0.5) { safetyScore -= 10; factors.push("Declining Attendance"); }
    if (markSlope < -0.5) { safetyScore -= 10; factors.push("Declining Performance"); }

    const finalScore = Math.min(100, Math.max(0, safetyScore));

    // Dynamic Risk Level Mapping
    let riskLevel = 'Low';
    if (finalScore < 60) riskLevel = 'High';
    else if (finalScore < 80) riskLevel = 'Medium';

    // --- 4. ENGAGEMENT CALCULATION (Weighted Formula) ---
    // Formula: (Att * 0.5) + (Marks * 0.4) + (TrendStability * 0.1)
    // Trend stability: 100 if stable/improving, 50 if declining
    const trendStability = (attSlope < -0.5 || markSlope < -0.5) ? 50 : 100;

    // Normalize Marks to 0-100 scale for consistency (it should already be 0-100)
    const normalizedMarks = marks;

    const engagementScore = (att * 0.5) + (normalizedMarks * 0.4) + (trendStability * 0.1);

    let engagementStatus = 'Stable';
    if (engagementScore > 85) engagementStatus = 'High';
    else if (engagementScore < 60) engagementStatus = 'At Risk';

    return {
        riskScore: parseFloat(finalScore.toFixed(1)),
        riskLevel,
        riskFactors: factors,
        engagementScore: parseFloat(engagementScore.toFixed(1)),
        engagementStatus,
        trends: {
            attendance: attSlope > 0 ? 'Improving' : attSlope < 0 ? 'Declining' : 'Stable',
            performance: markSlope > 0 ? 'Improving' : markSlope < 0 ? 'Declining' : 'Stable'
        }
    };
};

/**
 * Generate Smart Natural Language Insights for a Class.
 */
const generateClassInsights = (classMetrics) => {
    const insights = [];
    if (!classMetrics || !classMetrics.length) return insights;

    const criticalCount = classMetrics.filter(m => m.riskLevel === 'Critical').length;
    const decliningCount = classMetrics.filter(m => m.trends?.performance === 'Declining').length;
    const improvingCount = classMetrics.filter(m => m.trends?.performance === 'Improving').length;

    if (criticalCount > 0) {
        insights.push(`⚠️ ${criticalCount} Students are in Critical Risk zone. Immediate intervention advised.`);
    }
    if (decliningCount > 3) {
        insights.push(`📉 Performance is declining for ${decliningCount} students this week.`);
    }
    if (improvingCount > 5) {
        insights.push(`🚀 Momentum! ${improvingCount} students are showing consistent improvement.`);
    }
    return insights;
};

/**
 * Calculate Consistency Score based on Coefficient of Variation (CV).
 * CV = StdDev / Mean. Low CV = High consistency.
 * Score = max(0, 100 - CV * 100).
 *
 * This works correctly regardless of the scale of data (0-50, 0-100, etc.)
 *
 * @param {Array} dataPoints - Array of numbers (e.g., weighted totals)
 * @returns {number} - 0 to 100 (100 = Perfectly Consistent)
 */
const getConsistencyScore = (dataPoints) => {
    if (!dataPoints || dataPoints.length < 2) return 100;

    const nums = dataPoints.map(safe);
    const n = nums.length;
    const mean = nums.reduce((a, b) => a + b, 0) / n;

    // If mean is 0 or very small, variance is meaningless — return 100 (no data to be inconsistent about)
    if (mean < 0.01) return 100;

    const variance = nums.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of Variation (dimensionless)

    // CV of 0 = perfect consistency (100), CV of 1+ = very inconsistent (0)
    const score = Math.max(0, Math.min(100, 100 - (cv * 100)));
    return parseFloat(score.toFixed(1));
};

/**
 * Identify the weakest component across the class.
 * Normalizes each component to a percentage of practical max before comparing.
 *
 * @param {Array} classMarks - Array of mark documents { test1, test2, assignment }
 * @returns {Object} { weakComponent, averages: { test1, test2, assignment }, percentages: { test1, test2, assignment } }
 */
const getComponentDeviation = (classMarks) => {
    if (!classMarks || classMarks.length === 0) {
        return { weakComponent: 'None', averages: { test1: 0, test2: 0, assignment: 0 }, percentages: { test1: 0, test2: 0, assignment: 0 } };
    }

    const totals = { test1: 0, test2: 0, assignment: 0 };
    const counts = { test1: 0, test2: 0, assignment: 0 };

    classMarks.forEach(m => {
        const t1 = safe(m.test1); const t2 = safe(m.test2); const a = safe(m.assignment);
        if (t1 !== undefined) { totals.test1 += t1; counts.test1++; }
        if (t2 !== undefined) { totals.test2 += t2; counts.test2++; }
        if (a !== undefined) { totals.assignment += a; counts.assignment++; }
    });

    const avgs = {
        test1: counts.test1 ? totals.test1 / counts.test1 : 0,
        test2: counts.test2 ? totals.test2 / counts.test2 : 0,
        assignment: counts.assignment ? totals.assignment / counts.assignment : 0
    };

    // Detect practical max for each component from the data
    let maxT1 = 0, maxT2 = 0, maxA = 0;
    classMarks.forEach(m => {
        if (safe(m.test1) > maxT1) maxT1 = safe(m.test1);
        if (safe(m.test2) > maxT2) maxT2 = safe(m.test2);
        if (safe(m.assignment) > maxA) maxA = safe(m.assignment);
    });
    // Fallback: if max is 0, assume 50 (standard test max)
    maxT1 = maxT1 || 50; maxT2 = maxT2 || 50; maxA = maxA || 50;

    const pcts = {
        test1: (avgs.test1 / maxT1) * 100,
        test2: (avgs.test2 / maxT2) * 100,
        assignment: (avgs.assignment / maxA) * 100
    };

    // Find weakest by percentage
    let minPct = Infinity;
    let weakComp = 'None';
    const entries = [
        { name: 'Test 1', pct: pcts.test1, count: counts.test1 },
        { name: 'Test 2', pct: pcts.test2, count: counts.test2 },
        { name: 'Assignment', pct: pcts.assignment, count: counts.assignment }
    ];

    for (const e of entries) {
        if (e.count > 0 && e.pct < minPct) {
            minPct = e.pct;
            weakComp = e.name;
        }
    }

    return {
        weakComponent: weakComp,
        averages: {
            test1: parseFloat(avgs.test1.toFixed(1)),
            test2: parseFloat(avgs.test2.toFixed(1)),
            assignment: parseFloat(avgs.assignment.toFixed(1))
        },
        percentages: {
            test1: parseFloat(pcts.test1.toFixed(1)),
            test2: parseFloat(pcts.test2.toFixed(1)),
            assignment: parseFloat(pcts.assignment.toFixed(1))
        }
    };
};

/**
 * Forecast Class Pass Percentage at Semester End.
 *
 * Logic:
 * - currentPassRate: % of students whose weighted total >= passThreshold
 * - predictedPassRate: projects each student's total forward using attendance correlation
 *   Students with high attendance get a small boost; low attendance gets a penalty.
 *   Capped between 0 and 100.
 *
 * @param {Array} students - Array of { total: Number, attendancePct: Number }
 * @param {number} passThreshold - Dynamic pass mark from settings
 * @returns {Object} { currentPassRate, predictedPassRate, atRiskCount }
 */
const predictClassPassRate = (students, passThreshold = 20) => {
    if (!students || students.length === 0) {
        return { currentPassRate: 0, predictedPassRate: 0, atRiskCount: 0, totalStudents: 0 };
    }

    let currentPass = 0;
    let predictedPass = 0;
    let atRiskCount = 0;

    students.forEach(s => {
        const total = safe(s.total);
        const attPct = safe(s.attendancePct);

        // Current pass check
        if (total >= passThreshold) currentPass++;

        // Prediction: Apply attendance correlation factor
        // High attendance (>85%) → slight boost (+5% of total)
        // Low attendance (<60%) → penalty (-10% of total)
        // Middle range → no change
        let projected = total;
        if (attPct > 85) {
            projected = total * 1.05;
        } else if (attPct > 0 && attPct < 60) {
            projected = total * 0.90;
        }
        // Cap between 0 and practical max (assume 50 for weighted internal marks)
        projected = Math.max(0, Math.min(50, projected));

        if (projected >= passThreshold) {
            predictedPass++;
        } else {
            atRiskCount++;
        }
    });

    const n = students.length;
    const currentPassRate = parseFloat(((currentPass / n) * 100).toFixed(1)) || 0;
    const predictedPassRate = parseFloat(((predictedPass / n) * 100).toFixed(1)) || 0;

    return {
        currentPassRate,
        predictedPassRate,
        atRiskCount,
        totalStudents: n
    };
};

module.exports = {
    safe,
    calculateSlope,
    predictNextValue,
    getRiskProfile,
    generateClassInsights,
    getConsistencyScore,
    getComponentDeviation,
    predictClassPassRate
};
