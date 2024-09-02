#!/bin/bash

set -e

usage()
{
    echo "usage: publish [[[--set-version X.X.X ] [-i]] | [-h]]"
}

new_version=

while [ "$1" != "" ]; do
    case $1 in
        --set-version )           shift
                                new_version=$1
                                ;;
        -h | --help )           usage
                                exit
                                ;;
        * )                     usage
                                exit 1
    esac
    shift
done

if [ -z "$new_version" ]; then
    usage
    exit 1
fi

if [ "$(git branch --show-current)" != "master" ]; then
  echo "Git branch is NOT master!"
  exit 1
fi

if [ ! -z "$(git status --porcelain)" ]; then
  echo "Git working tree is NOT clean!"
  exit 1
fi

# Replace version in package.json and package-lock.json files
for package_path in package.json package-lock.json
do
    awk '{if (match($0, /^  "version"/) > 0) print "  \"version\": \"'${new_version}'\"," ;else print}' $package_path > tmp
    mv tmp $package_path
done

rm -rf node_modules
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use
npm ci
npm run build
npm run build:docs
npm pack
npm publish

git add . -A
git commit -m 'publish '${new_version}
git tag $new_version
git push

echo "Success"
exit 0
