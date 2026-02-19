/**
 * @desc    Calculate Risk Level using Logistic Regression
 * @param   {number} attendancePercentage
 * @param   {number} avgMarks
 * @returns {object} { probability, riskLevel }
 */
const calculateRisk = (attendancePercentage, avgMarks) => {
    // Weights (Pre-tuned parameters)
    const w1 = -0.1; // Attendance weight (negative because high attendance = low risk)
    const w2 = -0.1; // Marks weight
    const b = 10;    // Bias

    // Logistic Regression Formula
    // P(risk) = 1 / (1 + e^-(w1*A + w2*M + b))
    const z = (w1 * attendancePercentage) + (w2 * avgMarks) + b;
    const probability = 1 / (1 + Math.exp(-z));

    // Classification Thresholds
    let riskLevel = 'Safe';
    if (probability > 0.7) {
        riskLevel = 'High Risk';
    } else if (probability >= 0.4) {
        riskLevel = 'Moderate';
    }

    return {
        probability: parseFloat((probability * 100).toFixed(2)), // Return as percentage for UI
        riskLevel
    };
};

module.exports = calculateRisk;
