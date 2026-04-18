document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedback-form");
  const message = document.getElementById("feedback-message");

  if (!window.sb || !form) return;

  async function requireParticipantSession() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "./login.html";
      return null;
    }

    return user;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Submitting feedback...";
    message.className = "message";

    const user = await requireParticipantSession();
    if (!user) return;

    const formData = new FormData(form);

    const payload = {
      submitted_by: user.id,
      kind: formData.get("kind")?.toString().trim(),
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
