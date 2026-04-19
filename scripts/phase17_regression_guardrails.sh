#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

failures=0

check() {
  local description="$1"
  local command="$2"

  if eval "$command" >/dev/null 2>&1; then
    echo "PASS - $description"
  else
    echo "FAIL - $description"
    failures=$((failures + 1))
  fi
}

# Access control guardrails
check "Auth guard defines participant/admin gate functions" "rg -n 'requireParticipantPage|requireAdminPage' docs/assets/js/auth-guards.js"
check "Participant pages enforce participant guard" "rg -n 'requireParticipantPage\(' docs/assets/js/participant-dashboard.js docs/assets/js/participant-status.js docs/assets/js/participant-progress.js docs/assets/js/submit-feedback.js docs/assets/js/participant-feedback-history.js"
check "Admin pages enforce admin guard" "rg -n 'requireAdminPage\(' docs/assets/js/admin-dashboard.js docs/assets/js/applications.js docs/assets/js/participants.js docs/assets/js/admin-progress.js docs/assets/js/admin-feedback.js docs/assets/js/reports.js"

# Participant creation
check "Participants page has create participant workflow" "rg -n 'create-participant|Create Participant|functions/v1/create-participant' docs/assets/js/participants.js"

# Onboarding acknowledgement
check "Participant onboarding acknowledgement surfaced" "rg -n 'materials_acknowledged_at|onboard_status' docs/assets/js/participants.js docs/assets/js/participant-dashboard.js"

# Progress save/update
check "Participant progress upsert exists" "rg -n 'from\("participant_progress"\)|upsert\(' docs/assets/js/participant-progress.js"
check "Admin progress review/update exists" "rg -n 'from\("participant_progress"\)|update\(' docs/assets/js/admin-progress.js"

# Feedback submit/review
check "Participant feedback submission exists" "rg -n 'from\("feedback_items"\)|insert\(' docs/assets/js/submit-feedback.js"
check "Admin feedback review/update exists" "rg -n 'from\("feedback_items"\)|update\(' docs/assets/js/admin-feedback.js"

# CSV exports
check "Reports page contains all CSV export controls" "rg -n 'export-applications|export-participants|export-progress|export-feedback|export-admin-actions' docs/reports.html docs/assets/js/reports.js"

if [[ "$failures" -gt 0 ]]; then
  echo "\nPhase 17 guardrail checks FAILED ($failures issue(s))."
  exit 1
fi

echo "\nPhase 17 guardrail checks PASSED."
