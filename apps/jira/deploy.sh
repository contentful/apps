#!/bin/bash
set -eu

cd "$(dirname "$0")"

pushd functions
  npm i
  npm run build
  npm run deploy
popd

pushd jira-app
  npm i
  npm run build
  aws s3 sync ./build s3://cf-apps-jira --acl public-read
popd
