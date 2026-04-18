document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("participant-status-message");
  const content = document.getElementById("participant-status-content");

  if (!window.sb || !content) return;

  async function loadStatus() {
    message.textContent = "Loading your status...";
    message.className = "message";

    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireParticipantPage();
    if (!context) return;

    const { participant } = context;

    if (!participant) {
      content.innerHTML = `<div class="placeholder">No participant status record is available yet.</div>`;
      message.textContent = "No participant record was found.";
      message.className = "message error";
      return;
    }

    content.innerHTML = `
      <article class="item-card">
        <div class="meta">
          <div><strong>Group:</strong> ${participant.group_name || "—"}</div>
          <div><strong>Scenario:</strong> ${participant.scenario_name || "—"}</div>
          <div><strong>Wave:</strong> ${participant.wave_name || "—"}</div>
          <div><strong>Onboarding Status:</strong> ${participant.onboard_status || "—"}</div>
          <div><strong>Active:</strong> ${participant.is_active ? "Yes" : "No"}</div>
          <div><strong>Approved At:</strong> ${participant.approved_at ? new Date(participant.approved_at).toLocaleString() : "—"}</div>
          <div><strong>Application ID:</strong> ${participant.application_id || "—"}</div>
        </div>
      </article>
    `;

    message.textContent = "Status loaded successfully.";
    message.className = "message success";
  }

  loadStatus();
});
