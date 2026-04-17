document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("participant-dashboard-message");
  const content = document.getElementById("participant-dashboard-content");
  const signoutBtn = document.getElementById("participant-signout");

  if (!window.sb || !content) return;

  async function requireParticipantSession() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "./login.html";
      return null;
    }

    return user;
  }

  async function loadDashboard() {
    message.textContent = "Loading your dashboard...";
    message.className = "message";

    const user = await requireParticipantSession();
    if (!user) return;

    const { data: profile, error: profileError } = await window.sb
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(profileError);
      message.textContent = profileError.message;
      message.className = "message error";
      return;
    }

    const { data: participant, error: participantError } = await window.sb
      .from("participants")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (participantError) {
      console.error(participantError);
      message.textContent = participantError.message;
      message.className = "message error";
      return;
    }

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
