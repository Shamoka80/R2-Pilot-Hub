document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("approved-applications-list");
  const message = document.getElementById("participants-message");
  const refreshBtn = document.getElementById("refresh-participants-page");

  if (!window.sb || !list) return;

  async function requireAdmin() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "./admin-login.html";
      return false;
    }

    const { data: profile, error } = await window.sb
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      await window.sb.auth.signOut();
      window.location.href = "./admin-login.html";
      return false;
    }

    return true;
  }

  function renderApprovedApplications(items) {
    if (!items.length) {
      list.innerHTML = `<div class="placeholder">No approved applications are waiting for participant creation.</div>`;
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="item-card">
        <div class="item-header">
          <h3>${item.applicant_name}</h3>
          <span class="badge success">${item.status}</span>
        </div>

        <div class="meta">
          <div><strong>Email:</strong> ${item.applicant_email}</div>
          <div><strong>Organization:</strong> ${item.organization_name || "—"}</div>
          <div><strong>Original Group Interest:</strong> ${item.group_interest || "—"}</div>
          <div><strong>Original Scenario:</strong> ${item.scenario_context || "—"}</div>
        </div>

        <div class="field-grid">
          <div>
            <label for="group-${item.id}">Assign Group</label>
            <select id="group-${item.id}">
              <option value="">Select one</option>
              <option value="Facility Group">Facility Group</option>
              <option value="Consultant Group">Consultant Group</option>
              <option value="Certification Review Group">Certification Review Group</option>
              <option value="Program Observer Group">Program Observer Group</option>
            </select>
          </div>

          <div>
            <label for="scenario-${item.id}">Assign Scenario</label>
            <select id="scenario-${item.id}">
              <option value="">Select one</option>
              <option value="First-Time Seeker">First-Time Seeker</option>
              <option value="Active Certified">Active Certified</option>
              <option value="Lapsed / Not Renewed">Lapsed / Not Renewed</option>
              <option value="Failed / Revoked / Suspended / Remediation-Focused">Failed / Revoked / Suspended / Remediation-Focused</option>
            </select>
          </div>

          <div>
            <label for="wave-${item.id}">Assign Wave</label>
            <select id="wave-${item.id}">
              <option value="">Select one</option>
              <option value="Wave 1">Wave 1</option>
              <option value="Wave 2">Wave 2</option>
              <option value="Wave 3">Wave 3</option>
            </select>
          </div>
        </div>

        <div class="actions">
          <button type="button" data-create-participant="${item.id}">Create Participant</button>
        </div>
      </article>
    `).join("");
  }

  async function loadApprovedApplications() {
    message.textContent = "Loading approved applications...";
    message.className = "message";

    const { data: approvedApps, error: appsError } = await window.sb
      .from("applications")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (appsError) {
      console.error(appsError);
      message.textContent = appsError.message;
      message.className = "message error";
      return;
    }

    const { data: existingParticipants, error: participantsError } = await window.sb
      .from("participants")
      .select("application_id");

    if (participantsError) {
      console.error(participantsError);
      message.textContent = participantsError.message;
      message.className = "message error";
      return;
    }

    const existingApplicationIds = new Set(
      (existingParticipants || [])
        .map((p) => p.application_id)
        .filter(Boolean)
    );

    const availableApps = (approvedApps || []).filter(
      (app) => !existingApplicationIds.has(app.id)
    );

    renderApprovedApplications(availableApps);
    message.textContent = `Loaded ${availableApps.length} approved application(s) awaiting participant creation.`;
    message.className = "message success";
  }

  async function createParticipantFromApplication(application) {
    const group_name = document.getElementById(`group-${application.id}`)?.value || "";
    const scenario_name = document.getElementById(`scenario-${application.id}`)?.value || "";
    const wave_name = document.getElementById(`wave-${application.id}`)?.value || "";

    if (!group_name || !scenario_name || !wave_name) {
      message.textContent = "You must select Group, Scenario, and Wave before creating a participant.";
      message.className = "message error";
      return;
    }

    message.textContent = "Creating participant...";
    message.className = "message";

    const { data: sessionData } = await window.sb.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!accessToken) {
      message.textContent = "No admin session is available.";
      message.className = "message error";
      return;
    }

    const functionUrl = `${window.APP_CONFIG.supabaseUrl}/functions/v1/create-participant`;

    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        application_id: application.id,
        applicant_name: application.applicant_name,
        applicant_email: application.applicant_email,
        group_name,
        scenario_name,
        wave_name
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(result);
      message.textContent = result.error || "Participant creation failed.";
      message.className = "message error";
      return;
    }

    message.textContent = `Participant created successfully for ${application.applicant_email}.`;
    message.className = "message success";
    await loadApprovedApplications();
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-create-participant]");
    if (!button) return;

    const applicationId = button.dataset.createParticipant;
    if (!applicationId) return;

    const { data: application, error } = await window.sb
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (error || !application) {
      message.textContent = "Failed to load selected application.";
      message.className = "message error";
      return;
    }

    await createParticipantFromApplication(application);
  });

  refreshBtn?.addEventListener("click", loadApprovedApplications);

  (async () => {
    const ok = await requireAdmin();
    if (!ok) return;
    await loadApprovedApplications();
  })();
});
