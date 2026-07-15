#!/bin/bash
# Runs after Write|Edit. Scopes to the changed file's related tests when the
# stack supports it; falls back to a full run for stacks without scoping.
# Exit 2 signals asyncRewake to surface the failure back to Claude.

file=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty')

if [ -f "package.json" ]; then
  if grep -q '"vitest"' package.json; then
    npx vitest related "$file" --run 2>&1
  elif grep -q '"jest"' package.json || [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
    npx jest --findRelatedTests "$file" 2>&1
  else
    npm test -- --watchAll=false --bail 1 2>&1
  fi
elif [ -f "pom.xml" ]; then
  mvn test -q 2>&1
elif [ -f "build.gradle" ]; then
  ./gradlew test 2>&1
else
  exit 0
fi

status=$?
[ "$status" -ne 0 ] && exit 2
exit 0
