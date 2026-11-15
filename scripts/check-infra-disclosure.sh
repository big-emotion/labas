#!/bin/sh
# The repository is public: it must never name the server behind labas.africa, its IP address
# or its hosting provider. Coordinates live in the GitHub deploy variables and the operator's
# private notes (docs/deploy.md). Exit 1 and list the lines when one slips in.
found=$(git grep -nIiE '([0-9]{1,3}\.){3}[0-9]{1,3}|vps-[a-z0-9]+|ovh|ionos' -- . \
  ':!package-lock.json' ':!scripts/check-infra-disclosure.sh')
if [ -n "$found" ]; then
  echo "Infrastructure coordinates or provider names in tracked files:"
  echo "$found"
  exit 1
fi
