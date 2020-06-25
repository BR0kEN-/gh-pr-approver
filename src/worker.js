const { log, skip } = require('./logger');

/**
 * @param {Octokit & RestEndpointMethods} octokit
 * @param {string} approver
 * @param {string} org
 * @param {string} query
 * @param {string[]} acceptedAuthors
 *
 * @return {Promise<void>}
 */
async function worker(octokit, approver, org, query, acceptedAuthors) {
  const q = `org:${org}+${query} in:name`;
  log(`Looking for repositories matching the "${q}" query.`);
  const { data: { items: repos } } = await octokit.search.repos({ q });

  if (repos.length === 0) {
    log(`No repositories matching the "${q}" query.`);
  } else {
    const repoNames = repos.map(({ name }) => `- ${name}`);

    log([
      `${repoNames.length} repositories match the "${q}*" query:`,
      ...repoNames,
    ]);

    const pulls = (await Promise.all(
      repos.map((repo) => octokit.pulls.list({
        repo: repo.name,
        owner: org,
        state: 'open',
      })),
    ))
      .map(({ data }) => data)
      .filter((data) => data.length > 0)
      .flat();

    if (pulls.length === 0) {
      log('No open PRs found.');
    } else {
      log(`Found ${pulls.length} open PRs.`);

      for (const { url, title, number, user, draft, requested_reviewers, head } of pulls) {
        if (draft) {
          skip(url, title, 'Draft cannot get automated approval.');
          continue;
        }

        // This property contains only users that didn't provide a review. Our name disappears
        // from here after approval and can get back only if someone re-request a review.
        if (!requested_reviewers.map(({ login }) => login).includes(approver)) {
          skip(url, title, `The PR doesn't request a review from ${approver}.`);
          continue;
        }

        if (!acceptedAuthors.includes(user.login)) {
          skip(url, title, `The PR is authored by a user (${user.login}) that can't get automated approval.`);
          continue;
        }

        octokit.pulls
          .createReview({
            repo: head.repo.name,
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

module.exports = {
  worker,
};
