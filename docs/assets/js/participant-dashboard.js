document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("participant-dashboard-message");
  const content = document.getElementById("participant-dashboard-content");
  const signoutBtn = document.getElementById("participant-signout");

  if (!window.sb || !content) return;

  async function loadDashboard() {
    message.textContent = "Loading your dashboard...";
    message.className = "message";

    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireParticipantPage();
    if (!context) return;

    const { profile, participant } = context;

    content.innerHTML = `
      <article class="item-card">
        <h3>Account</h3>
        <div class="meta">
          <div><strong>Name:</strong> ${profile.full_name || "—"}</div>
          <div><strong>Email:</strong> ${profile.email || "—"}</div>
          <div><strong>Role:</strong> ${profile.role || "—"}</div>
        </div>
      </article>

      <article class="item-card">
        <h3>Assignment</h3>
        <div class="meta">
          <div><strong>Group:</strong> ${participant?.group_name || "—"}</div>
          <div><strong>Scenario:</strong> ${participant?.scenario_name || "—"}</div>
          <div><strong>Wave:</strong> ${participant?.wave_name || "—"}</div>
          <div><strong>Onboarding Status:</strong> ${participant?.onboard_status || "—"}</div>
          <div><strong>Active:</strong> ${participant?.is_active ? "Yes" : "No"}</div>
        </div>
      </article>
    `;

    message.textContent = "Dashboard loaded successfully.";
    message.className = "message success";
  }

  signoutBtn?.addEventListener("click", async () => {
    await window.sb.auth.signOut();
    window.location.href = "./login.html";
  });

  loadDashboard();
});
