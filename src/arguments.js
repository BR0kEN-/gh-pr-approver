const { ArgumentParser } = require('argparse');
const { name, version, description } = require('../package.json');
const { error } = require('./logger');

const parser = new ArgumentParser({ prog: name, version, description });
const tokenEnvVar = 'GITHUB_ACCESS_TOKEN';
const intervalBounds = Object.freeze({
  min: 3,
  max: 120,
  default: 10,
});

parser.addArgument('org', {
  type: String,
  help: 'The name of a Github organization.',
});

parser.addArgument('slug', {
  type: String,
  help: 'The partial match of a repository name. The smaller the name the more repositories will be selected.',
});

parser.addArgument(['-i', '--interval'], {
  type: (value) => {
    value = parseFloat(value);

    if (Number.isNaN(value)) {
      throw new TypeError();
    }

    return value;
  },
  help: `The interval (in minutes) to check for requested reviews (defaults to ${intervalBounds.default}, minimum - ${intervalBounds.min}, maximum - ${intervalBounds.max}).`,
  defaultValue: 10,
});

parser.addArgument(['-a', '--accept-author'], {
  type: String,
  dest: 'acceptedAuthors',
  help: 'The Github username whose PRs should be automatically approved.',
  action: 'append',
  metavar: 'USERNAME',
  defaultValue: [],
});

const { org, slug, interval, acceptedAuthors } = parser.parseArgs();
const { [tokenEnvVar]: token } = process.env;
// Ensure unique values.
const authors = [...new Set(acceptedAuthors)].filter(Boolean);

if (authors.length === 0) {
  error('Please specify at least one user who should get their PRs approved automatically.');
  process.exit(1);
}

if (interval < intervalBounds.min || interval > intervalBounds.max) {
  error(`The interval to check for requested reviews must be between ${intervalBounds.min} and ${intervalBounds.max} minutes, while actually set to ${interval}.`);
  process.exit(1);
}

if (typeof token !== 'string' || token.length < 40) {
  error(`Please specify valid Github access token in the "${tokenEnvVar}" environment variable.`);
  process.exit(1);
}

module.exports = {
  org,
  slug,
  token,
  interval,
  acceptedAuthors: authors,
};
