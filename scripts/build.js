import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync(path.join(root, 'public'), dist, { recursive: true });
fs.cpSync(path.join(root, 'src', 'grades.js'), path.join(dist, 'grades.js'));

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const env = process.env;

const buildInfo = {
  version: pkg.version,
  commit: env.GITHUB_SHA ?? 'local-build',
  ref: env.GITHUB_REF_NAME ?? 'local',
  runNumber: env.GITHUB_RUN_NUMBER ?? 'n/a',
  runUrl:
    env.GITHUB_SERVER_URL && env.GITHUB_REPOSITORY && env.GITHUB_RUN_ID
      ? `${env.GITHUB_SERVER_URL}/${env.GITHUB_REPOSITORY}/actions/runs/${env.GITHUB_RUN_ID}`
      : null,
  actor: env.GITHUB_ACTOR ?? 'local',
  builtAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
};

fs.writeFileSync(path.join(dist, 'build-info.json'), `${JSON.stringify(buildInfo, null, 2)}\n`);

const files = fs.readdirSync(dist);
console.log(`Built ${files.length} files into dist/`);
console.log(`  version : ${buildInfo.version}`);
console.log(`  commit  : ${buildInfo.commit}`);
console.log(`  ref     : ${buildInfo.ref}`);
console.log(`  builtAt : ${buildInfo.builtAt}`);
