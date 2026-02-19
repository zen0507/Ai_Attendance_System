const calculateSemester = (batchStartDate) => {
    if (!batchStartDate) return 'S1'; // Default

    const start = new Date(batchStartDate);
    const now = new Date();

    // Calculate difference in months
    const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

    // Logic: Each semester is roughly 6 months
    // 0-5 months: S1
    // 6-11 months: S2
    // 12-17 months: S3
    // etc.

    const semesterIndex = Math.floor(diffMonths / 6) + 1;

    // Cap at S8 (assuming 4 year course max, or adjust as needed)
    if (semesterIndex < 1) return 'S1';
    // if (semesterIndex > 8) return 'S8'; // Optional cap

    return `S${semesterIndex}`;
};

module.exports = { calculateSemester };
