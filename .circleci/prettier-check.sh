#! /bin/sh
# Runs a prettier check against changed files on the current branch compared against master.The
# purpose of this script is to fail if a change gets past the commit hooks which enforce prettier
# rules.

# kill switch if for some reason this script inadvertently blocks the build
test -n "$SKIP_PRETTIER_CHECK" && exit 0

MERGE_BASE=$(git merge-base HEAD origin/master)
CHANGED_FILES=$(git diff --name-only --diff-filter=d $MERGE_BASE | egrep --color=no "\.[jt]s(x)?$" | xargs)
echo $CHANGED_FILES

test -z "$CHANGED_FILES" && echo "No files for prettier to check. Skipping..." && exit 0

echo "Running 'prettier -l' against changed files to check for problems..."
echo ""

PRETTIER_OUTPUT=$(./node_modules/.bin/prettier -l $CHANGED_FILES)
echo ""
test -n "$PRETTIER_OUTPUT" && echo "prettier violations found:" || echo "no violations found"
echo "$PRETTIER_OUTPUT"

# exit 1 if output (i.e. prettier violations found), 0 if no output (i.e. no prettier violations found)
test -z "$PRETTIER_OUTPUT"
