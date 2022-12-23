import { Octokit } from '@octokit/rest';
import { org, query, token, interval, acceptedAuthors } from './arguments.mjs';
import { log, error } from './logger.mjs';
import { worker } from './worker.mjs';

const octokit = new Octokit({ auth: token });
const { data: { login: approver } } = await octokit.users.getAuthenticated();

log([
  `PRs created by these users and requesting a review from ${approver} will be automatically approved:`,
  ...[...acceptedAuthors].map((user) => `- ${user}`),
]);

export async function check() {
  try {
    await worker(octokit, approver, org, query, acceptedAuthors);
  } catch (e) {
    error(e.toString());
  }
}

export async function daemon() {
  const sleepTimeout = interval * 60 * 1000;
  let iteration = 0;

  // noinspection InfiniteLoopJS
  while (true) {
    log(`Iteration #${++iteration}.`);
    await check();
    log(`The next check will be performed in ${interval} minutes.`);
    await new Promise((resolve) => setTimeout(() => process.nextTick(resolve), sleepTimeout));
  }
}

const main = ({ check, daemon })[process.env.npm_lifecycle_event];

if (typeof main === 'function') {
  main();
}
