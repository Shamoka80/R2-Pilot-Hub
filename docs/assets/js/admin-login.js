document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const forgotPasswordBtn = document.getElementById("admin-forgot-password");
  const message = document.getElementById("admin-login-message");

  if (!form || !window.sb || !message) return;

  function setMessage(text, type = "") {
    message.textContent = text;
    message.className = type ? `message ${type}` : "message";
  }

  function getRecoveryRedirectUrl() {
    return new URL("./admin-reset-password.html", window.location.href).toString();
  }

  async function verifyAdminAndRedirect() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    const { data: profile, error } = await window.sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      await window.sb.auth.signOut();
      setMessage("Access denied. This account is not an administrator.", "error");
      return;
    }

    window.location.href = "./admin-dashboard.html";
  }

  verifyAdminAndRedirect();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("Signing in...");

    const formData = new FormData(form);
    const email = formData.get("admin_email")?.toString().trim();
    const password = formData.get("admin_password")?.toString();

    const { error } = await window.sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(error);
      setMessage(error.message, "error");
      return;
    }

    await verifyAdminAndRedirect();
  });

  forgotPasswordBtn?.addEventListener("click", async () => {
    const emailInput = document.getElementById("admin_email");
    const email = emailInput?.value?.trim();

    if (!email) {
      setMessage("Enter your admin email first, then select 'Forgot password?'.", "error");
      emailInput?.focus();
      return;
    }

    setMessage("Sending password reset email...");

    const { error } = await window.sb.auth.resetPasswordForEmail(email, {
      redirectTo: getRecoveryRedirectUrl()
    });

    if (error) {
      console.error(error);
      setMessage(error.message, "error");
      return;
    }

    setMessage("If an account exists, a password reset link has been sent.", "success");
  });
});
