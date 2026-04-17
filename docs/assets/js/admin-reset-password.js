document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-reset-password-form");
  const message = document.getElementById("admin-reset-password-message");

  if (!form || !window.sb || !message) return;

  function setMessage(text, type = "") {
    message.textContent = text;
    message.className = type ? `message ${type}` : "message";
  }

  async function validateRecoverySession() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      setMessage("Invalid or expired reset link. Request a new one from Admin Login.", "error");
      return null;
    }

    const { data: profile, error } = await window.sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      await window.sb.auth.signOut();
      setMessage("This reset link is not authorized for an administrator account.", "error");
      return null;
    }

    return user;
  }

  validateRecoverySession();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const password = formData.get("new_password")?.toString() || "";
    const confirm = formData.get("confirm_password")?.toString() || "";

    if (password.length < 12) {
      setMessage("Password must be at least 12 characters.", "error");
      return;
    }

    if (password !== confirm) {
      setMessage("Passwords do not match.", "error");
      return;
    }

    const user = await validateRecoverySession();
    if (!user) return;

    setMessage("Updating password...");

    const { error } = await window.sb.auth.updateUser({ password });

    if (error) {
      console.error(error);
      setMessage(error.message, "error");
      return;
    }

    await window.sb.auth.signOut();
    setMessage("Password updated successfully. Redirecting to Admin Login...", "success");

    setTimeout(() => {
      window.location.href = "./admin-login.html";
    }, 1500);
  });
});
