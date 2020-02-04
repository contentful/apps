#!/bin/bash
set -eu

function runTSTests {
  npm i
  npm run lint
  npm run test
  npm run build
}

cd "$(dirname "$0")"

pushd functions
runTSTests
popd

pushd jira-app
runTSTests
popd
