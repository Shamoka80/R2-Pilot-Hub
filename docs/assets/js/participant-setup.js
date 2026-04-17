document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("participant-setup-form");
  const message = document.getElementById("participant-setup-message");

  if (!form || !window.sb) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Saving password...";
    message.className = "message";

    const formData = new FormData(form);
    const newPassword = formData.get("new_password")?.toString();
    const confirmPassword = formData.get("confirm_password")?.toString();

    if (!newPassword || !confirmPassword) {
      message.textContent = "Both password fields are required.";
      message.className = "message error";
      return;
    }

    if (newPassword !== confirmPassword) {
      message.textContent = "Passwords do not match.";
      message.className = "message error";
      return;
    }

    const { error } = await window.sb.auth.updateUser({
      password: newPassword
    });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    message.textContent = "Password saved successfully. Redirecting to login...";
    message.className = "message success";

    setTimeout(() => {
      window.location.href = "./login.html";
    }, 1500);
  });
});
