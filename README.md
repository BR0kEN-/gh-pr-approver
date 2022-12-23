# Automated GitHub Pull Request approver

The worker that automatically approves pull requests on GitHub from the authors you trust.

## Usage

```
$ npm run daemon -- -h
usage: gh-pr-approver [-h] [-i INTERVAL] [-a USERNAME] org query

Automated GitHub Pull Request approver.

positional arguments:
  org                   The name of a GitHub organization. Can be superseded by the
                        "GITHUB_ORGANIZATION" environment variable.
  query                 The query to find repositories (e.g. "fluent" or "fluent OR typescript").
                        Can be superseded by the "GITHUB_REPOS_QUERY" environment variable.

optional arguments:
  -h, --help            show this help message and exit
  -i INTERVAL, --interval INTERVAL
                        The interval (in minutes) to check for requested reviews (defaults to 10,
                        minimum - 3, maximum - 120). Can be superseded by the "CHECK_INTERVAL"
                        environment variable.
  -a USERNAME, --accept-author USERNAME
                        The GitHub usernames whose PRs should be automatically approved. Can be
                        superseded by the "GITHUB_ACCEPTED_AUTHORS" environment variable.
```

### Example

This configuration starts a worker that checks for open PRs once in 10 minutes in the repositories of `microsoft` organization, containing the `fluent` or `typescript` in their names (see https://github.com/orgs/microsoft/repositories?q=fluent+OR+typescript+in%3Aname). You can also use logical operators like `OR` and `AND` to widen the results (e.g. `fluent OR typescript OR gsl`, https://github.com/orgs/microsoft/repositories?q=fluent+OR+typescript+OR+gsl+in%3Aname). See more at https://help.github.com/en/github/searching-for-information-on-github/searching-for-repositories.

The PR can be automatically approved when the following rules met:
- the PR is not a draft;
- the PR was created by users specified by the `--accept-author`;
- the PR requests a review from a user the access token belongs to.

```shell
export GITHUB_ACCESS_TOKEN=your_token
npm run daemon -- microsoft "fluent OR typescript" --accept-author BR0kEN- --accept-author jondoe
```

#### Notes

- The `GITHUB_ACCESS_TOKEN` environment variable is mandatory and must contain a valid GitHub access token that can be used for accessing a range of repositories.
- The worker will approve a PR again in case the previous review has been dismissed and the new one requested.
- Add as many `--accept-author` as you need.
- It is possible to replace `npm run daemon` arguments with the environment variables. Example:
  ```shell
  export GITHUB_ACCESS_TOKEN=your_token
  export GITHUB_ORGANIZATION=microsoft
  export GITHUB_REPOS_QUERY="fluent OR typescript"
  # The `+` character is a separator
  # allowing to provide multiple users.
  export GITHUB_ACCEPTED_AUTHORS="BR0kEN-+jondoe"
  export CHECK_INTERVAL=5
  npm run daemon
  ```

## Deploy

- [AWS](deploy/aws)
