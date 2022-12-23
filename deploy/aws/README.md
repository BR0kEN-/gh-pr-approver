# Deploy to AWS

The AWS Free Tier is enough to serve multiple bot instances. Create an account, choose the region, take a key and secret, and you're all set to start the deployment.

## Dependencies

- Zip
- Docker
- Node.js 16+
- Python 3.8+

## Deploy the app

> Note, that you can omit `AWS_` environment variables in front of the `npm run deploy` if you have AWS credentials set up in the `~/.aws/credentials`.
>
> In case there are many profiles, supply `AWS_PROFILE=my-profile`.

```shell
AWS_REGION=eu-west-1 \
AWS_ACCESS_KEY_ID=FFFFFFFFFFFFFFFFFFFF \
AWS_SECRET_ACCESS_KEY=FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF \
GITHUB_ACCESS_TOKEN=WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW \
npm run deploy -- \
  aws \
  microsoft \
  "fluent OR typescript" \
  --interval 5 \
  --accept-author BR0kEN- \
  --accept-author jondoe
```

Each app gets organization-based resources naming, allowing you to create as many instances as there are GitHub organizations you can access.

> Please bear in mind that many instances may exceed the AWS free tier limitations. This also depends on how many resources your account is using before provisioning a first bot instance.
>
> An empty AWS account may host up to 5 app instances freely in case the check interval is set to 6 minutes and Lambda run time takes 10 seconds (400 000 seconds of AWS Lambda per month).
>
> 10 invocations per hour * 24 hours * 30 days * 10 seconds = 72 000 seconds per app.

## Delete the app

To delete the app, pass the GitHub organization name and `--down` option.

```shell
AWS_REGION=eu-west-1 \
AWS_ACCESS_KEY_ID=FFFFFFFFFFFFFFFFFFFF \
AWS_SECRET_ACCESS_KEY=FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF \
GITHUB_ACCESS_TOKEN=WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW \
npm run deploy -- \
  aws \
  microsoft \
  --down
```
