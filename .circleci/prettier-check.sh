#! /bin/sh
# Runs a prettier check against changed files on the current branch compared against a base branch. By
# default uses `GITHUB_PR_BASE_BRANCH` as the base, which will be the branch being merged to in CI. The
# purpose of this script is to fail if a change gets passed the commit hooks which enforce prettier
# rules.

BASE_BRANCH="${GITHUB_PR_BASE_BRANCH:-master}"
CHANGED_FILES=$(git diff --name-only HEAD $BASE_BRANCH | xargs)

echo "Running 'prettier -l' against changed files to check for problems..."
echo ""

PRETTIER_OUTPUT=$(npx prettier -l $CHANGED_FILES)

test -n $PRETTIER_OUTPUT && echo "Error: Prettier violations found! See list below:"
echo $PRETTIER_OUTPUT 

# exit 1 if output (i.e. prettier violations found), 0 if no output (i.e. no prettier violations found)
test -n $PRETTIER_OUTPUT
