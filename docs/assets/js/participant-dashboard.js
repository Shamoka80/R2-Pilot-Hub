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
          <div><strong>NDA Status:</strong> ${participant?.nda_status || "—"}</div>
          <div><strong>Orientation Status:</strong> ${participant?.orientation_status || "—"}</div>
        </div>
      </article>

      <article class="item-card">
        <h3>Onboarding Resources</h3>
        <div class="meta">
          <div><strong>Packet Link:</strong> ${
            participant?.onboarding_packet_url
              ? `<a href="${participant.onboarding_packet_url}" target="_blank" rel="noopener noreferrer">Open onboarding packet</a>`
              : "No packet link has been assigned yet."
          }</div>
        </div>
        <div class="notes-block">
          <strong>Instructions</strong>
          <p>${participant?.onboarding_instructions || "No onboarding instructions have been added yet."}</p>
        </div>
        <div class="notes-block">
          <strong>Materials Acknowledged</strong>
          <p>${participant?.materials_acknowledged_at ? new Date(participant.materials_acknowledged_at).toLocaleString() : "Not yet acknowledged."}</p>
        </div>
        <div class="actions">
          <button id="acknowledge-materials" type="button">Acknowledge Materials</button>
        </div>
      </article>
    `;

    const acknowledgeBtn = document.getElementById("acknowledge-materials");

    acknowledgeBtn?.addEventListener("click", async () => {
      message.textContent = "Saving acknowledgement...";
      message.className = "message";

      const { error } = await window.sb
        .from("participants")
        .update({
          materials_acknowledged_at: new Date().toISOString()
        })
        .eq("user_id", profile.id);

      if (error) {
        console.error(error);
        message.textContent = error.message;
        message.className = "message error";
        return;
      }

      message.textContent = "Onboarding materials acknowledged successfully.";
      message.className = "message success";
      await loadDashboard();
    });

    message.textContent = "Dashboard loaded successfully.";
    message.className = "message success";
  }

  signoutBtn?.addEventListener("click", async () => {
    await window.sb.auth.signOut();
    window.location.href = "./login.html";
  });

  loadDashboard();
});
