document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("participant-login-form");
  const resetForm = document.getElementById("participant-reset-form");
  const loginMessage = document.getElementById("participant-login-message");
  const resetMessage = document.getElementById("participant-reset-message");

  if (!window.sb) return;

  async function redirectIfAlreadySignedIn() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;
    if (user) {
      window.location.href = "./participant-dashboard.html";
    }
  }

  redirectIfAlreadySignedIn();

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginMessage.textContent = "Signing in...";
    loginMessage.className = "message";

    const formData = new FormData(loginForm);
    const email = formData.get("participant_email")?.toString().trim();
    const password = formData.get("participant_password")?.toString();

    const { error } = await window.sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(error);
      loginMessage.textContent = error.message;
      loginMessage.className = "message error";
      return;
    }

    window.location.href = "./participant-dashboard.html";
  });

  resetForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    resetMessage.textContent = "Sending email link...";
    resetMessage.className = "message";

    const formData = new FormData(resetForm);
    const email = formData.get("participant_reset_email")?.toString().trim();

    const { error } = await window.sb.auth.resetPasswordForEmail(email, {
      redirectTo: "https://shamoka80.github.io/R2-Pilot-Hub/participant-setup.html"
    });

    if (error) {
      console.error(error);
      resetMessage.textContent = error.message;
      resetMessage.className = "message error";
      return;
    }

    resetMessage.textContent = "Setup/reset email sent. Check your inbox.";
    resetMessage.className = "message success";
    resetForm.reset();
  });
});
