document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const message = document.getElementById("admin-login-message");

  if (!form || !window.sb) return;

  function setMessage(text, type = "error") {
    message.textContent = text;
    message.className = `message ${type}`;
  }

  function showReasonMessageFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");

    if (!reason) return;

    const reasonMessages = {
      access: "You do not currently have administrator access."
    };

    const text = reasonMessages[reason];
    if (text) {
      setMessage(text, "error");
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
      window.location.href = "./participant-dashboard.html";
      return;
    }
  }

  showReasonMessageFromUrl();
  redirectIfAlreadySignedIn();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setMessage("Signing in...", "success");

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

    if (!window.AuthGuards) {
      window.location.href = "./admin-dashboard.html";
      return;
    }

    const context = await window.AuthGuards.getSessionContext();

    if (context.profile?.role === "admin") {
      window.location.href = "./admin-dashboard.html";
      return;
    }

    if (context.profile?.role === "participant") {
      window.location.href = "./participant-dashboard.html";
      return;
    }

    await window.sb.auth.signOut();
    setMessage("You do not currently have administrator access.", "error");
  });
});
