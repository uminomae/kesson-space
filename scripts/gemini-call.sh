#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"

MODEL="${GEMINI_MODEL:-gemini-3.1-pro-preview}"
TIMEOUT_SECONDS="${GEMINI_TIMEOUT:-180}"
MAX_OUTPUT_TOKENS="${GEMINI_MAX_OUTPUT_TOKENS:-8192}"
TEMPERATURE="${GEMINI_TEMPERATURE:-0.65}"
PROMPT_FILE=""
READ_STDIN=0
RAW_JSON=0

usage() {
  cat <<'EOF'
Usage:
  gemini-call.sh [options] --prompt-file <file>
  gemini-call.sh [options] --stdin
  gemini-call.sh [options] "<prompt text>"

Options:
  -m, --model <name>          Model name (default: gemini-3.1-pro-preview)
  -p, --prompt-file <path>    Read prompt from file
  -s, --stdin                 Read prompt from stdin
  -t, --timeout <seconds>     HTTP timeout (default: 180)
      --max-output <tokens>   generationConfig.maxOutputTokens (default: 8192)
      --temperature <float>   generationConfig.temperature (default: 0.65)
      --raw-json              Print full JSON response
  -h, --help                  Show this help

Notes:
  - GEMINI_API_KEY is loaded from environment first.
  - If unset, this script tries to load /Users/uminomae/dev/kesson-space/.env
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--model)
      MODEL="$2"
      shift 2
      ;;
    -p|--prompt-file)
      PROMPT_FILE="$2"
      shift 2
      ;;
    -s|--stdin)
      READ_STDIN=1
      shift
      ;;
    -t|--timeout)
      TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    --max-output)
      MAX_OUTPUT_TOKENS="$2"
      shift 2
      ;;
    --temperature)
      TEMPERATURE="$2"
      shift 2
      ;;
    --raw-json)
      RAW_JSON=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
    *)
      break
      ;;
  esac
done

if [[ -z "${GEMINI_API_KEY:-}" && -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  set -a; source "${ENV_FILE}"; set +a
fi

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "GEMINI_API_KEY is not set. Export it or add it to ${ENV_FILE}" >&2
  exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
  echo "curl command is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq command is required" >&2
  exit 1
fi

PROMPT=""
if [[ -n "${PROMPT_FILE}" ]]; then
  if [[ ! -f "${PROMPT_FILE}" ]]; then
    echo "Prompt file not found: ${PROMPT_FILE}" >&2
    exit 1
  fi
  PROMPT="$(cat "${PROMPT_FILE}")"
elif [[ "${READ_STDIN}" -eq 1 ]]; then
  PROMPT="$(cat)"
elif [[ $# -gt 0 ]]; then
  PROMPT="$*"
fi

if [[ -z "${PROMPT}" ]]; then
  echo "Prompt is empty. Use --prompt-file, --stdin, or a positional prompt text." >&2
  usage
  exit 2
fi

PAYLOAD="$(jq -n \
  --arg prompt "${PROMPT}" \
  --argjson maxOutput "${MAX_OUTPUT_TOKENS}" \
  --argjson temperature "${TEMPERATURE}" \
  '{
    contents: [{ role: "user", parts: [{ text: $prompt }] }],
    generationConfig: {
      maxOutputTokens: $maxOutput,
      temperature: $temperature
    }
  }'
)"

API_URL="https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}"

RESPONSE="$(curl -sS --max-time "${TIMEOUT_SECONDS}" \
  -H "Content-Type: application/json" \
  "${API_URL}" \
  -d "${PAYLOAD}")"

if [[ "${RAW_JSON}" -eq 1 ]]; then
  echo "${RESPONSE}"
  exit 0
fi

ERROR_MESSAGE="$(echo "${RESPONSE}" | jq -r '.error.message // empty')"
if [[ -n "${ERROR_MESSAGE}" ]]; then
  echo "Gemini API error: ${ERROR_MESSAGE}" >&2
  exit 1
fi

TEXT_OUTPUT="$(echo "${RESPONSE}" | jq -r '[.candidates[]?.content.parts[]?.text] | join("\n\n")')"

if [[ -z "${TEXT_OUTPUT}" || "${TEXT_OUTPUT}" == "null" ]]; then
  echo "No text output found. Use --raw-json to inspect response." >&2
  exit 1
fi

echo "${TEXT_OUTPUT}"
