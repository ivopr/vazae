#!/usr/bin/env bash
# Works out the build's version for GitHub Actions and writes two outputs:
#   label    the version shown to people and used in file names
#            (v1.2.3-rc1 tag -> 1.2.3-rc1; untagged -> 0.0.<run>-<sha>)
#   numeric  X.Y.Z only, for fields that reject anything else (Windows
#            version resources, the NSIS installer)
set -euo pipefail

if [[ "${GITHUB_REF:-}" == refs/tags/v* ]]; then
  label="${GITHUB_REF_NAME#v}"
  numeric="${label%%-*}"
else
  numeric="0.0.${GITHUB_RUN_NUMBER:-0}"
  label="${numeric}-${GITHUB_SHA:0:7}"
fi

if ! [[ "$numeric" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Version tags must look like v1.2.3 or v1.2.3-rc1; got ${GITHUB_REF_NAME:-?}" >&2
  exit 1
fi

echo "label=$label" >> "$GITHUB_OUTPUT"
echo "numeric=$numeric" >> "$GITHUB_OUTPUT"
echo "Version: $label ($numeric)"
