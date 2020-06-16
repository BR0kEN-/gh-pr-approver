const { Octokit } = require('@octokit/rest');
const { org, slug, token, interval, acceptedAuthors } = require('./arguments');
const { log, error } = require('./logger');
const { worker } = require('./worker');

const SLEEP_MILLISECONDS = interval * 60 * 1000;

async function main() {
  const octokit = new Octokit({ auth: token });
  const { data: { login: approver } } = await octokit.users.getAuthenticated();
  let iteration = 0;

  log([
    `PRs created by these users and requesting a review from ${approver} will be automatically approved:`,
    ...acceptedAuthors.map((user) => `- ${user}`),
  ]);

  // noinspection InfiniteLoopJS
  while (true) {
    log(`Iteration #${++iteration}.`);
    await worker(octokit, approver, org, slug, acceptedAuthors);
    log(`The next check will be performed in ${interval} minutes.`);
    await new Promise((resolve) => setTimeout(() => process.nextTick(resolve), SLEEP_MILLISECONDS));
  }
}

main().catch((e) => error(e.toString()));
