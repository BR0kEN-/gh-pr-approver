import { writeFileSync } from 'node:fs';
import { org, query, token, interval, acceptedAuthors } from '../../src/arguments.mjs';

writeFileSync(
  process.env.PARAMS_PATH,
  JSON.stringify(
    [
      ['AppName', process.env.STACK_NAME],
      ['S3BucketName', process.env.S3_BUCKET_NAME],
      ['S3ArtifactPath', process.env.S3_ARTIFACT_PATH],
      ['GitHubAcceptedAuthors', [...acceptedAuthors].join('+')],
      ['GitHubOrganization', org],
      ['GitHubAccessToken', token],
      ['GitHubReposQuery', query],
      ['CheckInterval', interval.toString()],
    ].reduce(
      (accumulator, [ParameterKey, ParameterValue]) => {
        accumulator.push({ ParameterKey, ParameterValue });

        return accumulator;
      },
      [],
    ),
    null,
    4,
  ),
);
