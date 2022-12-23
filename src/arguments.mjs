import { ArgumentParser, HelpFormatter } from 'argparse';
import libInfo from '../package.json' assert { type: 'json' };

class HelpFormatterNarrow extends HelpFormatter {
  constructor(args) {
    args.width = 100;
    super(args);
  }
}

const envVarNames = Object.freeze({
  org: 'GITHUB_ORGANIZATION',
  query: 'GITHUB_REPOS_QUERY',
  token: 'GITHUB_ACCESS_TOKEN',
  authors: 'GITHUB_ACCEPTED_AUTHORS',
  interval: 'CHECK_INTERVAL',
});

const intervalBounds = Object.freeze({
  min: 3,
  max: 120,
  default: 10,
});

const parser = new ArgumentParser({
  prog: libInfo.name,
  description: libInfo.description,
  formatter_class: HelpFormatterNarrow,
});

function getDescription(description, envVar) {
  return `${description} Can be superseded by the "${envVar}" environment variable.`;
}

// Allow providing required arguments via environment variables.
for (const [index, name] of [
  [2, envVarNames.org],
  [3, envVarNames.query],
]) {
  if (process.env[name]) {
    // Behave as a fallback.
    process.argv[index] ??= process.env[name];
  }
}

parser.add_argument('org', {
  type: 'str',
  help: getDescription(
    'The name of a GitHub organization.',
    envVarNames.org,
  ),
});

parser.add_argument('query', {
  type: 'str',
  help: getDescription(
    'The query to find repositories (e.g. "fluent" or "fluent OR typescript").',
    envVarNames.query,
  ),
});

parser.add_argument('-i', '--interval', {
  type: 'int',
  default: Number(process.env[envVarNames.interval]) || 10,
  help: getDescription(
    `The interval (in minutes) to check for requested reviews (defaults to ${intervalBounds.default}, minimum - ${intervalBounds.min}, maximum - ${intervalBounds.max}).`,
    envVarNames.interval,
  ),
});

parser.add_argument('-a', '--accept-author', {
  type: 'str',
  dest: 'authors',
  action: 'append',
  metavar: 'USERNAME',
  default: process.env[envVarNames.authors]?.split('+') ?? [],
  help: getDescription(
    'The GitHub usernames whose PRs should be automatically approved.',
    envVarNames.authors,
  ),
});

export const { org, query, interval, authors } = parser.parse_args();
export const { [envVarNames.token]: token } = process.env;
// Ensure unique values.
export const acceptedAuthors = new Set(authors);

if (acceptedAuthors.size === 0) {
  parser.error('Please specify at least one user who should get their PRs approved automatically.');
  parser.exit(1);
}

if (interval < intervalBounds.min || interval > intervalBounds.max) {
  parser.error(`The interval to check for requested reviews must be between ${intervalBounds.min} and ${intervalBounds.max} minutes, while actually set to ${interval}.`);
  parser.exit(2);
}

if (typeof token !== 'string' || token.length < 40) {
  parser.error(`Please specify valid GitHub access token in the "${envVarNames.token}" environment variable.`);
  parser.exit(3);
}
