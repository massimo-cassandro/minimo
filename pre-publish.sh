#!/bin/bash

rm -rf dist

mkdir -p dist/components
cp -r src/components/* dist/components/ 2>/dev/null || :

mkdir -p dist/css
cp -r src/css/* dist/css/ 2>/dev/null || :

mkdir -p dist/js
cp -r src/js/* dist/js/ 2>/dev/null || :


cp src/*.js dist/ 2>/dev/null || :
cp src/*.css dist/ 2>/dev/null || :

cp package.json dist/
[ -f README.md ] && cp README.md dist/
