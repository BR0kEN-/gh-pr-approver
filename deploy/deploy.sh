#!/usr/bin/env bash

# Example:
# ./deploy.sh aws microsoft "fluent OR typescript" -a BR0kEN- -a jondoe

set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

# ------------------------------------------------------------------------------
# Base parameters.
# ------------------------------------------------------------------------------

APP_DIR="$(dirname "$PWD")"
APP_NAME=gh-pr-approver

DEPLOY_ARGS=("$@")
DEPLOY_CLOUD="${DEPLOY_ARGS[*]:0:1}"

SELF_DIR="$PWD/$DEPLOY_CLOUD"
BUILD_DIR="$SELF_DIR/build"

DEPLOY_SCRIPT="$SELF_DIR/run.sh"

# ------------------------------------------------------------------------------
# Functions.
# ------------------------------------------------------------------------------

info() {
    echo -e "[INFO] @ $(date -Iseconds): $1"
}

# ------------------------------------------------------------------------------
# Runtime.
# ------------------------------------------------------------------------------

# Check for the value emptiness because the parent directory exists!
if [[ ! -x "$DEPLOY_SCRIPT" ]]; then
    info "Invalid cloud provider - $DEPLOY_CLOUD."
    exit 1
fi

mkdir -p "$BUILD_DIR"
export APP_DIR APP_NAME SELF_DIR BUILD_DIR
export -f info

"$DEPLOY_SCRIPT" "${DEPLOY_ARGS[@]:1}"
