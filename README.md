# Automated GitHub Pull Request approver

The worker that automatically approves pull requests on Github from the authors you trust.

## Usage

```
$ npm start -- -h
usage: gh-pr-approver [-h] [-v] [-i INTERVAL] [-a USERNAME] org slug

Automated GitHub Pull Request approver.

Positional arguments:
  org                   The name of a Github organization.
  slug                  The partial match of a repository name. The smaller
                        the name the more repositories will be selected.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -i INTERVAL, --interval INTERVAL
                        The interval (in minutes) to check for requested
                        reviews (defaults to 10, minimum - 3, maximum - 120).
  -a USERNAME, --accept-author USERNAME
                        The Github username whose PRs should be automatically
                        approved.
```

### Example

This configuration starts a worker that checks for open PRs once in 10 minutes in the repositories of `microsoft` organization, containing the `fluent` in their names (see https://github.com/microsoft?q=fluent%20in:name).

The PR can be automatically approved when the following rules met:
- the PR is not a draft;
- the PR was created by users specified by the `--accept-author`;
- the PR requests a review from a user the access token belongs to.

```bash
export GITHUB_ACCESS_TOKEN=your_token
npm start -- microsoft fluent --accept-author BR0kEN-
```

**NOTES**:
- the `GITHUB_ACCESS_TOKEN` environment variable is mandatory and must contain a valid Github access token that can be used for accessing the range of repositories you specify.
- the worker will approve a PR again in case the previous review has been dismissed and the new one requested;
- add as many `--accept-author` as you need.

## Heroku

Deploy the worker to Heroku to serve 24/7.

- Enable maintenance mode to put web UI offline.

  ```bash
  heroku maintenance:on --app gh-pr-approver
  ```

- Build and push the Docker image.

  ```bash
  heroku container:push gh-pr-approver \
      --app gh-pr-approver \
      --arg GITHUB_ORGANIZATION=microsoft,GITHUB_REPO_SLUG=fluent,GITHUB_ACCESS_TOKEN=your_token,GITHUB_ACCEPTED_AUTHORS=lokeoke+BR0kEN-,CHECK_INTERVAL=8
  ```

  **NOTES:**
  - define multiple `--accept-author` by separating usernames using `+` (e.g. `user1+user2+user3`);

- Release the app.

  ```bash
  heroku container:release gh-pr-approver --app gh-pr-approver
  ```

- Make sure the resource enabled.

  ![Enable the resource](docs/images/gh-pr-approver-heroku.gif)

- Check containers and see how much free quota left.

  ```bash
  heroku ps --app gh-pr-approver
  ```

- Check the logs to see the app is working.

  ```bash
  heroku logs --app gh-pr-approver --num=50 --tail
  ```
