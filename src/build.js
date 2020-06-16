const { writeFileSync } = require('fs');
const { GITHUB_ORGANIZATION, GITHUB_REPO_SLUG, GITHUB_ACCESS_TOKEN, GITHUB_ACCEPTED_AUTHORS, CHECK_INTERVAL } = process.env;
const command = [
  `GITHUB_ACCESS_TOKEN="${GITHUB_ACCESS_TOKEN}"`,
  'npm',
  'start',
  '--',
  GITHUB_ORGANIZATION,
  GITHUB_REPO_SLUG,
  '--interval',
  CHECK_INTERVAL,
  ...GITHUB_ACCEPTED_AUTHORS.split('+').map((user) => `--accept-author "${user}"`),
];

writeFileSync('run.sh', `#!/usr/bin/env ash\n${command.join(' ')}`);
