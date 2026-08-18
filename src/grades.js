export const GRADE_SCALE = [
  { min: 90, grade: 'O', points: 10, label: 'Outstanding' },
  { min: 80, grade: 'A+', points: 9, label: 'Excellent' },
  { min: 70, grade: 'A', points: 8, label: 'Very Good' },
  { min: 60, grade: 'B+', points: 7, label: 'Good' },
  { min: 50, grade: 'B', points: 6, label: 'Above Average' },
  { min: 40, grade: 'C', points: 5, label: 'Pass' },
  { min: 0, grade: 'F', points: 0, label: 'Fail' },


export const PASS_MARK = 40;

export function assertValidMarks(marks) {
  if (typeof marks !== 'number' || Number.isNaN(marks)) {
    throw new TypeError('Marks must be a number');
  }
  if (marks < 0 || marks > 100) {
    throw new RangeError('Marks must be between 0 and 100');
  }
}

export function getGrade(marks) {
  assertValidMarks(marks);
  const band = GRADE_SCALE.find((entry) => marks >= entry.min);
  return { grade: band.grade, points: band.points, label: band.label };
}

export function isPass(marks) {
  assertValidMarks(marks);
  return marks >= PASS_MARK;
}

export function calculateSGPA(subjects) {
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new TypeError('Provide a non-empty array of subjects');
  }

  let totalCredits = 0;
  let weightedPoints = 0;

  for (const subject of subjects) {
    const { credits, marks } = subject;
    if (typeof credits !== 'number' || credits <= 0) {
      throw new RangeError('Credits must be a positive number');
    }
    const { points } = getGrade(marks);
    totalCredits += credits;
    weightedPoints += points * credits;
  }

  return round2(weightedPoints / totalCredits);
}

export function buildResult(subjects) {
  const rows = subjects.map((subject, index) => {
    const { grade, points, label } = getGrade(subject.marks);
    return {
      name: subject.name ?? `Subject ${index + 1}`,
      credits: subject.credits,
      marks: subject.marks,
      grade,
      points,
      label,
      passed: isPass(subject.marks),
    };
  });

  const sgpa = calculateSGPA(subjects);
  const backlogs = rows.filter((row) => !row.passed);

  return {
    rows,
    sgpa,
    percentage: round2(rows.reduce((sum, r) => sum + r.marks, 0) / rows.length),
    totalCredits: rows.reduce((sum, r) => sum + r.credits, 0),
    backlogs: backlogs.map((row) => row.name),
    status: backlogs.length === 0 ? 'PASS' : 'FAIL',
    division: classify(sgpa, backlogs.length),
  };
}

export function classify(sgpa, backlogCount = 0) {
  if (backlogCount > 0) return 'Reappear';
  if (sgpa >= 8.5) return 'First Class with Distinction';
  if (sgpa >= 7) return 'First Class';
  if (sgpa >= 6) return 'Second Class';
  if (sgpa >= 5) return 'Pass Class';
  return 'Reappear';
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

