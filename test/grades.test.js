import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  PASS_MARK,
  assertValidMarks,
  buildResult,
  calculateSGPA,
  classify,
  getGrade,
  isPass,
} from '../src/grades.js';

describe('getGrade', () => {
  test('maps top marks to grade O', () => {
    assert.equal(getGrade(95).grade, 'O');
    assert.equal(getGrade(95).points, 10);
  });

  test('handles every boundary of the scale', () => {
    const boundaries = [
      [100, 'O'],
      [90, 'O'],
      [89, 'A+'],
      [80, 'A+'],
      [79, 'A'],
      [70, 'A'],
      [69, 'B+'],
      [60, 'B+'],
      [59, 'B'],
      [50, 'B'],
      [49, 'C'],
      [40, 'C'],
      [39, 'F'],
      [0, 'F'],
    ];
    for (const [marks, expected] of boundaries) {
      assert.equal(getGrade(marks).grade, expected, `${marks} should be ${expected}`);
    }
  });

  test('rejects marks outside 0-100', () => {
    assert.throws(() => getGrade(101), RangeError);
    assert.throws(() => getGrade(-1), RangeError);
  });

  test('rejects non-numeric marks', () => {
    assert.throws(() => getGrade('88'), TypeError);
    assert.throws(() => getGrade(NaN), TypeError);
  });
});

describe('isPass', () => {
  test('exactly the pass mark counts as a pass', () => {
    assert.equal(isPass(PASS_MARK), true);
  });

  test('one mark below the pass mark fails', () => {
    assert.equal(isPass(PASS_MARK - 1), false);
  });

  test('a student scoring 39 has NOT cleared the subject', () => {
    assert.equal(isPass(39), false);
  });

  test('a student scoring 40 HAS cleared the subject', () => {
    assert.equal(isPass(40), true);
  });
});

describe('assertValidMarks', () => {
  test('accepts valid input silently', () => {
    assert.doesNotThrow(() => assertValidMarks(55));
  });
});

describe('calculateSGPA', () => {
  test('averages equally weighted subjects', () => {
    const subjects = [
      { credits: 4, marks: 95 },
      { credits: 4, marks: 75 },
    ];
    assert.equal(calculateSGPA(subjects), 9);
  });

  test('respects credit weighting', () => {
    const subjects = [
      { credits: 6, marks: 95 },
      { credits: 2, marks: 45 },
    ];
    assert.equal(calculateSGPA(subjects), 8.75);
  });

  test('rounds to two decimal places', () => {
    const subjects = [
      { credits: 3, marks: 95 },
      { credits: 3, marks: 65 },
      { credits: 3, marks: 55 },
    ];
    assert.equal(calculateSGPA(subjects), 7.67);
  });

  test('rejects an empty subject list', () => {
    assert.throws(() => calculateSGPA([]), TypeError);
  });

  test('rejects zero or negative credits', () => {
    assert.throws(() => calculateSGPA([{ credits: 0, marks: 80 }]), RangeError);
  });
});

describe('classify', () => {
  test('assigns divisions by SGPA', () => {
    assert.equal(classify(9.1), 'First Class with Distinction');
    assert.equal(classify(7.4), 'First Class');
    assert.equal(classify(6.2), 'Second Class');
    assert.equal(classify(5.1), 'Pass Class');
    assert.equal(classify(4.0), 'Reappear');
  });

  test('any backlog forces a reappear regardless of SGPA', () => {
    assert.equal(classify(9.5, 1), 'Reappear');
  });
});

describe('buildResult', () => {
  const subjects = [
    { name: 'DevOps', credits: 4, marks: 92 },
    { name: 'Cloud Computing', credits: 4, marks: 78 },
    { name: 'Machine Learning', credits: 3, marks: 66 },
    { name: 'Project Work', credits: 2, marks: 88 },
  ];

  test('returns one row per subject', () => {
    assert.equal(buildResult(subjects).rows.length, 4);
  });

  test('reports PASS when no subject is below the pass mark', () => {
    assert.equal(buildResult(subjects).status, 'PASS');
    assert.deepEqual(buildResult(subjects).backlogs, []);
  });

  test('reports FAIL and lists backlogs', () => {
    const withBacklog = [...subjects, { name: 'Statistics', credits: 3, marks: 31 }];
    const result = buildResult(withBacklog);
    assert.equal(result.status, 'FAIL');
    assert.deepEqual(result.backlogs, ['Statistics']);
    assert.equal(result.division, 'Reappear');
  });

  test('sums total credits', () => {
    assert.equal(buildResult(subjects).totalCredits, 13);
  });

  test('falls back to a positional name when none is given', () => {
    const result = buildResult([{ credits: 4, marks: 70 }]);
    assert.equal(result.rows[0].name, 'Subject 1');
  });
});
