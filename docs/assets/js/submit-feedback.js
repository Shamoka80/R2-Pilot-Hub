document.addEventListener("DOMContentLoaded", () => {
  const ALLOWED_FEEDBACK_KINDS = new Set(["issue", "finding", "suggestion", "request"]);
  const form = document.getElementById("feedback-form");
  const message = document.getElementById("feedback-message");

  if (!window.sb || !form) return;

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

    if (!ALLOWED_FEEDBACK_KINDS.has(kind)) {
      message.textContent = "Invalid feedback type selected. Please choose Issue, Finding, Suggestion, or Request.";
      message.className = "message error";
      return;
    }

    const payload = {
      submitted_by: context.user.id,
      kind,
      title: formData.get("title")?.toString().trim(),
      details: formData.get("details")?.toString().trim(),
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
    message.textContent = "Feedback submitted successfully. You can review it on the My Feedback page.";
    message.className = "message success";
  });
});
