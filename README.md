# Automated GitHub Pull Request approver

## Usage

```
$ npm start -- -h
usage: gh-pr-approver [-h] [-v] [-i INTERVAL] [-a USERNAME] org slug

Automated GitHub Pull Request approver.

Positional arguments:
  org                   The name of a Github organization.
  slug                  The partial match of a repository name. The smaller
                        the name the more repositories will be selected. Use
                        with caution.

Optional arguments:
  -h, --help            Show this help message and exit.
  -v, --version         Show program's version number and exit.
  -i INTERVAL, --interval INTERVAL
                        The interval (in minutes) to check for requested
                        reviews (defaults to 10, minimum - 3, maximum - 120).
  -a USERNAME, --accept-author USERNAME
                        The username of a Github user the PRs of which can be
                        automatically approved.
```

### Example

This configuration starts a worker that checks for open PRs once in 10 minutes in the repositories of `microsoft` organization, containing the `fluent` in their names (see https://github.com/microsoft?q=fluent%20in:name).

The PR can be automatically approved when the following rules met:
- the PR is not a draft;
- the PR was created by users specified by the `--accept-author`;
- the PR requests a review from a user the access token belongs to.

```bash
GITHUB_ACCESS_TOKEN=TOKEN npm start -- microsoft fluent --accept-author BR0kEN-
```

**NOTES**:
- the `GITHUB_ACCESS_TOKEN` environment variable is mandatory and must contain a valid Github access token that can be used for accessing the range of repositories you specify.
- the worker will approve a PR again in case the previous review has been dismissed and the new one requested.

### Docker

```bash
docker build . -t gh-pr-approver:latest
docker run --rm -e GITHUB_ACCESS_TOKEN=TOKEN gh-pr-approver npm start -- microsoft fluent --accept-author BR0kEN-
```
