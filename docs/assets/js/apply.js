document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("application-form");
  const message = document.getElementById("application-message");

  if (!form || !window.sb) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Submitting...";
    message.className = "message";

    const formData = new FormData(form);

    const payload = {
      applicant_name: formData.get("applicant_name")?.toString().trim(),
      applicant_email: formData.get("applicant_email")?.toString().trim(),
      organization_name: formData.get("organization_name")?.toString().trim() || null,
      group_interest: formData.get("group_interest")?.toString().trim() || null,
      scenario_context: formData.get("scenario_context")?.toString().trim() || null,
      notes: formData.get("notes")?.toString().trim() || null
    };

    const { error } = await window.sb.from("applications").insert([payload]);

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    form.reset();
    window.location.href = "./thank-you.html";
  });
});
