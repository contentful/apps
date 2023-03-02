#! /bin/sh
# Runs a prettier check against changed files on the current branch compared against a base branch. By
# default uses `GITHUB_PR_BASE_BRANCH` as the base, which will be the branch being merged to in CI. The
# purpose of this script is to fail if a change gets passed the commit hooks which enforce prettier
# rules.

# make sure origin/master is populated, to run comparison against
git fetch origin master
CHANGED_FILES=$(git diff --name-only HEAD origin/master | egrep --color=no "\.[jt]s(x)?$" | xargs)
echo $CHANGED_FILES

echo "Running 'prettier -l' against changed files to check for problems..."
echo ""

PRETTIER_OUTPUT=$(npx prettier -l $CHANGED_FILES)
echo ""
test -n "$PRETTIER_OUTPUT" && echo "prettier violations found:"
echo "$PRETTIER_OUTPUT"

# exit 1 if output (i.e. prettier violations found), 0 if no output (i.e. no prettier violations found)
test -z "$PRETTIER_OUTPUT"
