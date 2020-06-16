const { Octokit } = require('@octokit/rest');
const { ArgumentParser } = require('argparse');
const { name, version, description } = require('../package.json');

const parser = new ArgumentParser({ prog: name, version, description });

parser.addArgument('org', {
  type: String,
  help: 'The name of a Github organization.',
});

parser.addArgument('slug', {
  type: String,
  help: 'The partial match of a repository name. The smaller the name the more repositories will be selected. Use with caution.',
});

parser.addArgument(['-a', '--accept-author'], {
  type: String,
  dest: 'acceptedAuthors',
  help: 'The username of a Github user the PRs of which can be automatically approved.',
  action: 'append',
  metavar: 'USERNAME',
  defaultValue: [],
});

const { org, slug, acceptedAuthors } = parser.parseArgs();
const { GITHUB_ACCESS_TOKEN } = process.env;
// Check for open PRs every 10 minutes.
const SLEEP_SECONDS = 600;

/**
 * @param {function(message: string): void} handler
 * @param {string} type
 * @param {string|string[]} lines
 */
function format(handler, type, lines) {
  if (typeof lines === 'string') {
    lines = [lines];
  }

  handler(`==> [${type}] @ ${new Date()}\n    ${lines.join('\n    ')}\n`);
}

/**
 * @param {string} url
 * @param {string} title
 * @param {string} message
 */
function skip(url, title, message) {
  format(console.warn, 'SKIP', [
    `URL: ${url}`,
    `Title: ${title}`,
    `Reason: ${message}`,
  ]);
}

/**
 * @param {string|string[]} message
 */
function error(message) {
  format(console.error, 'ERROR', message);
}

/**
 * @param {string|string[]} message
 */
function log(message) {
  format(console.warn, 'INFO', message);
}

if (typeof GITHUB_ACCESS_TOKEN !== 'string' || GITHUB_ACCESS_TOKEN.length < 40) {
  error('Please specify valid Github access token in the "GITHUB_ACCESS_TOKEN" environment variable.');
  process.exit(1);
}

(async () => {
  const octokit = new Octokit({
    auth: GITHUB_ACCESS_TOKEN,
  });

  const { data: { login: approver } } = await octokit.users.getAuthenticated();
  log(`Approver: ${approver}`);

  while (true) {
    log(`Looking for repositories matching the "${org}/${slug}*" query.`);
    const { data: { items: repos } } = await octokit.search.repos({
      q: `org:${org}+${slug} in:name`,
    });

    if (repos.length === 0) {
      log(`No repositories matching the "${org}/${slug}*" query.`);
    } else {
      log([
        `The following repositories match the "${org}/${slug}*" query:`,
        ...repos.map(({ name }) => `- ${name}`),
      ]);

      const pulls = (await Promise.all(repos.map((repo) => octokit.pulls.list({
        repo: repo.name,
        owner: org,
        state: 'open',
      })))).filter(({ data }) => data.length > 0);

      if (pulls.length === 0) {
        log('No open PRs found.');
      } else {
        log(`Found ${pulls.length} open PRs.`);

        for (const { data: pull } of pulls) {
          for (const { url, title, number, user, draft, requested_reviewers, head } of pull) {
            if (draft) {
              skip(url, title, 'Draft cannot get automated approval.');
              continue;
            }

            if (!acceptedAuthors.includes(user.login)) {
              skip(url, title, `The PR is authored by a user (${user.login}) that can't get automated approval.`);
              continue;
            }

            // This property contains only users that didn't provide a review. Our name disappears
            // from here after approval and can get back only if someone re-request a review.
            if (!requested_reviewers.map(({ login }) => login).includes(approver)) {
              skip(url, title, `The PR doesn't request a review from ${approver}.`);
              continue;
            }

            octokit.pulls
              .createReview({
                repo: head.repo.name,
                body: '👍',
                owner: org,
                event: 'APPROVE',
                commit_id: head.sha,
                pull_number: number,
              })
              .then(() => log(`Approved: ${url}`));
          }
        }
      }
    }

    log(`The next check will be performed in ${SLEEP_SECONDS / 60} minutes.`);
    await new Promise((resolve) => setTimeout(resolve, SLEEP_SECONDS * 1000));
  }
})();
