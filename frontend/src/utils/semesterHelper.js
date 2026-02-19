export const getSemesterList = (batch) => {
    if (!batch) return ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"]; // Default

    const years = batch.split('-');
    if (years.length !== 2) return ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];

    const startYear = parseInt(years[0]);
    const endYear = parseInt(years[1]);
    const duration = endYear - startYear;

    let totalSemesters = 8; // Default 4 years
    if (duration === 3) totalSemesters = 6;
    if (duration === 2) totalSemesters = 4;
    if (duration === 1) totalSemesters = 2;

    const semesters = [];
    for (let i = 1; i <= totalSemesters; i++) {
        semesters.push(`S${i}`);
    }
    return semesters;
};

export const calculateCurrentSemester = (batch) => {
    if (!batch) return "S1";

    const startYear = parseInt(batch.split('-')[0]);
    if (isNaN(startYear)) return "S1";

    // Assume Academic Year starts in August (Month 7, 0-indexed)
    // S1: Aug - Jan
    // S2: Feb - Jul
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const diffYears = currentYear - startYear;

    // Logic:
    // Year 0 (Start): Aug(7) -> S1
    // Year 1 (Next): Feb(1) -> S2, Aug(7) -> S3

    let semesterIndex = (diffYears * 2);

    // Adjust for month
    // If we are past Jan (Feb onwards), adding 1 more semester for the second half of academic year
    // Actually, let's look at months from start.
    // Start Date: Aug 1st of StartYear.
    const startDate = new Date(startYear, 7, 1); // Aug 1

    const diffMonths = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());

    // Each sem ~ 6 months
    // 0-5 months: Sem 1
    // 6-11 months: Sem 2
    // 12-17 months: Sem 3 (1 year diff)

    const calculatedSem = Math.floor(diffMonths / 6) + 1;

    const semList = getSemesterList(batch);
    // Clamp
    if (calculatedSem < 1) return "S1";
    if (calculatedSem > semList.length) return semList[semList.length - 1];

    return `S${calculatedSem}`;
};
