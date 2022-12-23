#!/usr/bin/env bash

# Example:
# ./deploy.sh aws microsoft "fluent OR typescript" -a BR0kEN- -a jondoe

set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

# ------------------------------------------------------------------------------
# Base parameters.
# ------------------------------------------------------------------------------

DEPLOY_ARGS=()
DEPLOY_CLOUD="${*:1:1}"

# Check for the value emptiness because the parent directory exists!
if [[ -z "$DEPLOY_CLOUD" || ! -d "$DEPLOY_CLOUD" ]]; then
  echo "Invalid cloud provider."
  exit 1
fi

export APP_NAME=gh-pr-approver

# ------------------------------------------------------------------------------
# Runtime.
# ------------------------------------------------------------------------------

# Read input arguments preserving their formatting.
while read -r i; do
  DEPLOY_ARGS+=("${!i}")
done < <(seq $#)

"$DEPLOY_CLOUD/run.sh" "${DEPLOY_ARGS[@]:1}"
