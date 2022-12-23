#!/usr/bin/env bash

set -e

# ------------------------------------------------------------------------------
# Base parameters.
# ------------------------------------------------------------------------------

# A unique package name is required in order to update the Lambda codebase.
ARCHIVE_NAME="$(date -Iseconds).zip"
ARCHIVE_PATH="$BUILD_DIR/$ARCHIVE_NAME"

export STACK_NAME="$APP_NAME--$1"
export PARAMS_PATH="$BUILD_DIR/cfn-params.json"
export S3_BUCKET_NAME="$STACK_NAME--resources"
export S3_ARTIFACT_PATH="provision/$ARCHIVE_NAME"
export PYTHONDONTWRITEBYTECODE=1

# ------------------------------------------------------------------------------
# Functions.
# ------------------------------------------------------------------------------

setup_python() {
    local VENV_DIR="$BUILD_DIR/venv"

    info "Creating Python virtual environment"
    test -d "$VENV_DIR" || python3 -m venv "$VENV_DIR"
    # shellcheck disable=SC1091
    source "$VENV_DIR/bin/activate"

    info "Install Python dependencies"
    pip config set --site global.cache-dir "$VENV_DIR/pip-cache" > /dev/null
    pip3 install --upgrade pip
    pip3 install -r "$SELF_DIR/requirements.txt"
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
    node --no-warnings "$SELF_DIR/cfn-params.mjs" "$@"

    setup_python

    info "Building an artifact"
    cd "$APP_DIR"
    zip --quiet --recurse-paths "$ARCHIVE_PATH" {src,node_modules,package*.json}

    info "Building Cloudformation template"
    python3 \
        "$SELF_DIR/cfn-merge.py" \
        "$SELF_DIR/cfn-base.yml" \
        "$SELF_DIR/cfn-app.yml" \
        "$BUILD_DIR/cfn.yml"

    CFN_DEPLOY=(
        aws cloudformation deploy
        --stack-name "$STACK_NAME"
        --capabilities CAPABILITY_NAMED_IAM
        --parameter-overrides "file://$PARAMS_PATH"
    )

    info "Checking the \"$STACK_NAME\" stack existence"
    if ! aws cloudformation describe-stacks --stack-name "$STACK_NAME" --max-items 1 --no-cli-pager > /dev/null 2>&1; then
        info "Creating the \"$STACK_NAME\" stack"
        "${CFN_DEPLOY[@]}" --template-file "$SELF_DIR/cfn-base.yml"
    fi

    info "Uploading an artifact"
    aws s3 cp "$ARCHIVE_PATH" "s3://$S3_BUCKET_NAME/$S3_ARTIFACT_PATH"

    info "Deploying"
    "${CFN_DEPLOY[@]}" --template-file "$BUILD_DIR/cfn.yml"
fi

info "Done"
