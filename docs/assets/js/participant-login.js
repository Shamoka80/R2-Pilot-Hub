document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("participant-login-form");
  const resetForm = document.getElementById("participant-reset-form");
  const loginMessage = document.getElementById("participant-login-message");
  const resetMessage = document.getElementById("participant-reset-message");

  if (!window.sb) return;

  function setLoginMessage(text, type = "error") {
    loginMessage.textContent = text;
    loginMessage.className = `message ${type}`;
  }

  function showReasonMessageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");

    if (!reason) return;

    const reasonMessages = {
      inactive: "Your participant account is currently inactive. Please contact the administrator.",
      archived: "Your participant account has been archived. Please contact the administrator.",
      no_record: "Your account is not linked to an active participant record. Please contact the administrator.",
      access: "You do not currently have participant access."
    };

    const text = reasonMessages[reason];
    if (text) {
      setLoginMessage(text, "error");
    }
  }

  async function redirectIfAlreadySignedIn() {
    if (!window.AuthGuards) return;

    const context = await window.AuthGuards.getSessionContext();

    if (!context.user) return;

    if (context.profile?.role === "admin") {
      window.location.href = "./admin-dashboard.html";
      return;
    }

    if (context.profile?.role === "participant") {
      if (!context.participant) {
        await window.sb.auth.signOut();
        setLoginMessage("Your account is not linked to an active participant record. Please contact the administrator.");
        return;
      }

      if (!context.participant.is_active) {
        await window.sb.auth.signOut();
        setLoginMessage("Your participant account is currently inactive. Please contact the administrator.");
        return;
      }

      if (context.participant.onboard_status === "archived") {
        await window.sb.auth.signOut();
        setLoginMessage("Your participant account has been archived. Please contact the administrator.");
        return;
      }

      window.location.href = "./participant-dashboard.html";
    }
  }

  showReasonMessageFromUrl();
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
      setLoginMessage(error.message, "error");
      return;
    }

    if (!window.AuthGuards) {
      window.location.href = "./participant-dashboard.html";
      return;
    }

    const context = await window.AuthGuards.getSessionContext();

    if (context.profile?.role === "admin") {
      window.location.href = "./admin-dashboard.html";
      return;
    }

    if (context.profile?.role !== "participant") {
      await window.sb.auth.signOut();
      setLoginMessage("You do not currently have participant access.", "error");
      return;
    }

    if (!context.participant) {
      await window.sb.auth.signOut();
      setLoginMessage("Your account is not linked to an active participant record. Please contact the administrator.", "error");
      return;
    }

    if (!context.participant.is_active) {
      await window.sb.auth.signOut();
      setLoginMessage("Your participant account is currently inactive. Please contact the administrator.", "error");
      return;
    }

    if (context.participant.onboard_status === "archived") {
      await window.sb.auth.signOut();
      setLoginMessage("Your participant account has been archived. Please contact the administrator.", "error");
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
