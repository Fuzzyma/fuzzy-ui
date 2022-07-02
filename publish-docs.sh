#!/usr/bin/env sh

# abort on errors
set -e

# install dependencies
yarn

# build
yarn docs:build

# navigate into the build output directory
cd docs/.vitepress/dist

# if you are deploying to a custom domain
# echo 'www.example.com' > CNAME

git init
git branch -m main

git add -A
git commit -m 'deploy'
git push -f git@github.com:fuzzyma/fuzzy-ui.git main:gh-pages

cd -