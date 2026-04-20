document.addEventListener("DOMContentLoaded", () => {
  const ALLOWED_FEEDBACK_KINDS = new Set(["issue", "finding", "suggestion", "request"]);
  const STRUCTURED_REQUIRED_KINDS = new Set(["issue", "finding"]);

  const form = document.getElementById("feedback-form");
  const message = document.getElementById("feedback-message");
  const kindField = document.getElementById("kind");
  const expectedBehaviorField = document.getElementById("expected_behavior");
  const actualBehaviorField = document.getElementById("actual_behavior");
  const reproductionStepsField = document.getElementById("reproduction_steps");

  if (!window.sb || !form) return;

  function normalizeOptionalText(value) {
    const normalized = value?.toString().trim() || "";
    return normalized || null;
  }

  function updateConditionalRequiredFields() {
    const kind = kindField?.value || "";
    const shouldRequireStructured = STRUCTURED_REQUIRED_KINDS.has(kind);

    if (expectedBehaviorField) expectedBehaviorField.required = shouldRequireStructured;
    if (actualBehaviorField) actualBehaviorField.required = shouldRequireStructured;
    if (reproductionStepsField) reproductionStepsField.required = shouldRequireStructured;
  }

  kindField?.addEventListener("change", updateConditionalRequiredFields);
  updateConditionalRequiredFields();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Submitting feedback...";
    message.className = "message";

    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireParticipantPage();
    if (!context) return;

    const formData = new FormData(form);
    const kind = formData.get("kind")?.toString().trim() || "";
    const r2ReadyArea = formData.get("r2_ready_area")?.toString().trim() || "";
    const expectedBehavior = normalizeOptionalText(formData.get("expected_behavior"));
    const actualBehavior = normalizeOptionalText(formData.get("actual_behavior"));
    const reproductionSteps = normalizeOptionalText(formData.get("reproduction_steps"));

    if (!ALLOWED_FEEDBACK_KINDS.has(kind)) {
      message.textContent = "Invalid feedback type selected. Please choose Issue, Finding, Suggestion, or Request.";
      message.className = "message error";
      return;
    }

    if (!r2ReadyArea) {
      message.textContent = "R2 Ready Area is required.";
      message.className = "message error";
      return;
    }

    if (
      STRUCTURED_REQUIRED_KINDS.has(kind) &&
      (!expectedBehavior || !actualBehavior || !reproductionSteps)
    ) {
      message.textContent = "Expected behavior, actual behavior, and reproduction steps are required for issues and findings.";
      message.className = "message error";
      return;
    }

    const payload = {
      submitted_by: context.user.id,
      kind,
      r2_ready_area: r2ReadyArea,
      title: formData.get("title")?.toString().trim(),
      details: formData.get("details")?.toString().trim(),
      expected_behavior: expectedBehavior,
      actual_behavior: actualBehavior,
      reproduction_steps: reproductionSteps,
      severity: formData.get("severity")?.toString().trim(),
      status: "open"
    };

    const { error } = await window.sb
      .from("feedback_items")
      .insert([payload]);

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    form.reset();
    updateConditionalRequiredFields();
    message.textContent = "Feedback submitted successfully. You can review it on the My Feedback page.";
    message.className = "message success";
  });
});
