import { buildResult } from './grades.js';

const DEFAULT_SUBJECTS = [
  { name: 'DevOps', credits: 4, marks: 92 },
  { name: 'Cloud Computing', credits: 4, marks: 78 },
  { name: 'Machine Learning', credits: 3, marks: 66 },
  { name: 'Project Work', credits: 2, marks: 88 },
];

const rowsBody = document.getElementById('rows');
const errorBox = document.getElementById('error');

function addRow(subject = { name: '', credits: 3, marks: 0 }) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input class="s-name" type="text" value="${subject.name}" placeholder="Subject name" /></td>
    <td><input class="s-credits" type="number" min="1" max="10" value="${subject.credits}" /></td>
    <td><input class="s-marks" type="number" min="0" max="100" value="${subject.marks}" /></td>
    <td><button type="button" class="remove" aria-label="Remove subject">&times;</button></td>
  `;
  tr.querySelector('.remove').addEventListener('click', () => tr.remove());
  rowsBody.appendChild(tr);
}

function readSubjects() {
  return [...rowsBody.querySelectorAll('tr')].map((tr) => ({
    name: tr.querySelector('.s-name').value.trim() || undefined,
    credits: Number(tr.querySelector('.s-credits').value),
    marks: Number(tr.querySelector('.s-marks').value),
  }));
}

function render(result) {
  document.getElementById('sgpa').textContent = result.sgpa.toFixed(2);
  document.getElementById('pct').textContent = `${result.percentage}%`;
  document.getElementById('credits').textContent = result.totalCredits;

  const statusEl = document.getElementById('status');
  statusEl.textContent = result.status;
  statusEl.className = result.status === 'PASS' ? 'ok' : 'bad';

  document.getElementById('division').textContent = result.division;

  document.getElementById('sheet').innerHTML = result.rows
    .map(
      (row) => `
        <tr>
          <td>${row.name}</td>
          <td>${row.marks}</td>
          <td><span class="pill">${row.grade}</span></td>
          <td>${row.points}</td>
          <td class="${row.passed ? 'ok' : 'bad'}">${row.passed ? row.label : 'Backlog'}</td>
        </tr>`,
    )
    .join('');

  document.getElementById('result-card').hidden = false;
}

document.getElementById('add').addEventListener('click', () => addRow());

document.getElementById('calc').addEventListener('click', () => {
  errorBox.textContent = '';
  try {
    render(buildResult(readSubjects()));
  } catch (err) {
    document.getElementById('result-card').hidden = true;
    errorBox.textContent = err.message;
  }
});

fetch('./build-info.json')
  .then((res) => res.json())
  .then((info) => {
    document.getElementById('b-version').textContent = info.version;
    document.getElementById('b-sha').textContent = info.commit.slice(0, 7);
    document.getElementById('b-ref').textContent = info.ref;
    document.getElementById('b-time').textContent = info.builtAt;
    const run = document.getElementById('b-run');
    if (info.runUrl) {
      run.innerHTML = `<a href="${info.runUrl}" target="_blank" rel="noreferrer">#${info.runNumber}</a>`;
    } else {
      run.textContent = info.runNumber;
    }
  })
  .catch(() => {});

DEFAULT_SUBJECTS.forEach(addRow);
