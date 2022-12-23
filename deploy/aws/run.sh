#!/usr/bin/env bash

set -e

cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p build
cd "$_"

# ------------------------------------------------------------------------------
# Base parameters.
# ------------------------------------------------------------------------------

# A unique package name is required in order to update the Lambda codebase.
ARCHIVE_NAME="$(date -Iseconds).zip"

export STACK_NAME="$APP_NAME--$1"
export S3_BUCKET_NAME="$STACK_NAME--resources"
export S3_ARTIFACT_PATH="provision/$ARCHIVE_NAME"
export PYTHONDONTWRITEBYTECODE=1

# ------------------------------------------------------------------------------
# Functions.
# ------------------------------------------------------------------------------

info() {
  echo -e "$(date -Iseconds) @ [INFO]: $1"
}

setup_python() {
  info "Creating Python virtual environment"
  test -d venv || python3 -m venv venv
  # shellcheck disable=SC1091
  source venv/bin/activate

  info "Install Python dependencies"
  pip config set --site global.cache-dir "$PWD/venv/pip-cache"
  pip3 install --upgrade pip
  pip3 install -r ../requirements.txt
}

# ------------------------------------------------------------------------------
# Runtime.
# ------------------------------------------------------------------------------

if [[ "$2" == "--down" ]]; then
  setup_python

  info "Deleting contents of the \"$S3_BUCKET_NAME\" S3 bucket"
  aws s3 rm "s3://$S3_BUCKET_NAME" --recursive || true

  info "Deleting the \"$STACK_NAME\" stack"
  aws cloudformation delete-stack --stack-name "$STACK_NAME"
  aws cloudformation wait stack-delete-complete --stack-name "$STACK_NAME"
else
  info "Validating deployment configuration"
  node --no-warnings ../cfn-params.mjs "$@"

  setup_python

  info "Building an artifact"
  BUILD_DIR="$PWD"
  cd ../../../
  zip --quiet --recurse-paths "$BUILD_DIR/$ARCHIVE_NAME" {src,node_modules,package*.json}
  cd "$BUILD_DIR"

  info "Building Cloudformation template"
  python3 ../cfn-merge.py ../cfn-base.yml ../cfn-app.yml cfn.yml

  CFN_DEPLOY=(
    aws cloudformation deploy
    --stack-name "$STACK_NAME"
    --capabilities CAPABILITY_NAMED_IAM
    --parameter-overrides "file://params.json"
  )

  info "Checking the \"$STACK_NAME\" stack existence"
  if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" --max-items 1 --no-cli-pager > /dev/null 2>&1; then
    info "Creating the \"$STACK_NAME\" stack"
    "${CFN_DEPLOY[@]}" --template-file ../cfn-base.yml
  fi

  info "Uploading an artifact"
  aws s3 cp "$ARCHIVE_NAME" "s3://$S3_BUCKET_NAME/$S3_ARTIFACT_PATH"

  info "Deploying"
  "${CFN_DEPLOY[@]}" --template-file cfn.yml
fi

info "Done"
