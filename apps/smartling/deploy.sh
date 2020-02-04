#!/bin/bash
set -eu

cd "$(dirname "$0")"

pushd frontend
  npm i
  npm run build -- --no-inline
  cp -Rv ./build ../lambda/static
popd

pushd lambda
  npm i
  npm run build
  npm run deploy
popd
