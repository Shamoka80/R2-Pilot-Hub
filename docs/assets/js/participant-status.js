document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("participant-status-message");
  const content = document.getElementById("participant-status-content");

  if (!window.sb || !content) return;

  async function loadStatus() {
    message.textContent = "Loading your status...";
    message.className = "message";

    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "./login.html";
      return;
    }

    const { data: participant, error } = await window.sb
      .from("participants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

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
