document.addEventListener("DOMContentLoaded", () => {
  const approvedList = document.getElementById("approved-applications-list");
  const existingList = document.getElementById("existing-participants-list");
  const message = document.getElementById("participants-message");
  const refreshBtn = document.getElementById("refresh-participants-page");

  if (!window.sb || !approvedList || !existingList) return;

  let currentAdmin = null;



  function renderApprovedApplications(items) {
    if (!items.length) {
      approvedList.innerHTML = `<div class="placeholder">No approved applications are waiting for participant creation.</div>`;
      return;
    }

    approvedList.innerHTML = items.map((item) => `
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
            <label for="create-group-${item.id}">Assign Group</label>
            <select id="create-group-${item.id}">
              <option value="">Select one</option>
              <option value="Facility Group">Facility Group</option>
              <option value="Consultant Group">Consultant Group</option>
              <option value="Certification Review Group">Certification Review Group</option>
              <option value="Program Observer Group">Program Observer Group</option>
            </select>
          </div>

          <div>
            <label for="create-scenario-${item.id}">Assign Scenario</label>
            <select id="create-scenario-${item.id}">
              <option value="">Select one</option>
              <option value="First-Time Seeker">First-Time Seeker</option>
              <option value="Active Certified">Active Certified</option>
              <option value="Lapsed / Not Renewed">Lapsed / Not Renewed</option>
              <option value="Failed / Revoked / Suspended / Remediation-Focused">Failed / Revoked / Suspended / Remediation-Focused</option>
            </select>
          </div>

          <div>
            <label for="create-wave-${item.id}">Assign Wave</label>
            <select id="create-wave-${item.id}">
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

  function renderExistingParticipants(items) {
    if (!items.length) {
      existingList.innerHTML = `<div class="placeholder">No participant records found.</div>`;
      return;
    }

    existingList.innerHTML = items.map((item) => `
      <article class="item-card">
        <div class="item-header">
          <h3>${item.profiles?.full_name || "—"}</h3>
          <span class="badge">${item.onboard_status}</span>
        </div>

        <div class="meta">
          <div><strong>Email:</strong> ${item.profiles?.email || "—"}</div>
          <div><strong>Current Group:</strong> ${item.group_name || "—"}</div>
          <div><strong>Current Scenario:</strong> ${item.scenario_name || "—"}</div>
          <div><strong>Current Wave:</strong> ${item.wave_name || "—"}</div>
          <div><strong>Active:</strong> ${item.is_active ? "Yes" : "No"}</div>
          <div><strong>Approved At:</strong> ${item.approved_at ? new Date(item.approved_at).toLocaleString() : "—"}</div>
        </div>

        <div class="field-grid">
          <div>
            <label for="group-${item.user_id}">Update Group</label>
            <select id="group-${item.user_id}">
              <option value="Facility Group" ${item.group_name === "Facility Group" ? "selected" : ""}>Facility Group</option>
              <option value="Consultant Group" ${item.group_name === "Consultant Group" ? "selected" : ""}>Consultant Group</option>
              <option value="Certification Review Group" ${item.group_name === "Certification Review Group" ? "selected" : ""}>Certification Review Group</option>
              <option value="Program Observer Group" ${item.group_name === "Program Observer Group" ? "selected" : ""}>Program Observer Group</option>
            </select>
          </div>

          <div>
            <label for="scenario-${item.user_id}">Update Scenario</label>
            <select id="scenario-${item.user_id}">
              <option value="First-Time Seeker" ${item.scenario_name === "First-Time Seeker" ? "selected" : ""}>First-Time Seeker</option>
              <option value="Active Certified" ${item.scenario_name === "Active Certified" ? "selected" : ""}>Active Certified</option>
              <option value="Lapsed / Not Renewed" ${item.scenario_name === "Lapsed / Not Renewed" ? "selected" : ""}>Lapsed / Not Renewed</option>
              <option value="Failed / Revoked / Suspended / Remediation-Focused" ${item.scenario_name === "Failed / Revoked / Suspended / Remediation-Focused" ? "selected" : ""}>Failed / Revoked / Suspended / Remediation-Focused</option>
            </select>
          </div>

          <div>
            <label for="wave-${item.user_id}">Update Wave</label>
            <select id="wave-${item.user_id}">
              <option value="Wave 1" ${item.wave_name === "Wave 1" ? "selected" : ""}>Wave 1</option>
              <option value="Wave 2" ${item.wave_name === "Wave 2" ? "selected" : ""}>Wave 2</option>
              <option value="Wave 3" ${item.wave_name === "Wave 3" ? "selected" : ""}>Wave 3</option>
            </select>
          </div>

          <div>
            <label for="status-${item.user_id}">Onboarding Status</label>
            <select id="status-${item.user_id}">
              <option value="not_started" ${item.onboard_status === "not_started" ? "selected" : ""}>not_started</option>
              <option value="invited" ${item.onboard_status === "invited" ? "selected" : ""}>invited</option>
              <option value="active" ${item.onboard_status === "active" ? "selected" : ""}>active</option>
              <option value="completed" ${item.onboard_status === "completed" ? "selected" : ""}>completed</option>
              <option value="archived" ${item.onboard_status === "archived" ? "selected" : ""}>archived</option>
            </select>
          </div>

          <div>
            <label for="active-${item.user_id}">Active State</label>
            <select id="active-${item.user_id}">
              <option value="true" ${item.is_active ? "selected" : ""}>true</option>
              <option value="false" ${!item.is_active ? "selected" : ""}>false</option>
            </select>
          </div>

          <div>
            <label for="nda-${item.user_id}">NDA Status</label>
            <select id="nda-${item.user_id}">
              <option value="not_sent" ${item.nda_status === "not_sent" ? "selected" : ""}>not_sent</option>
              <option value="sent" ${item.nda_status === "sent" ? "selected" : ""}>sent</option>
              <option value="received" ${item.nda_status === "received" ? "selected" : ""}>received</option>
              <option value="complete" ${item.nda_status === "complete" ? "selected" : ""}>complete</option>
            </select>
          </div>

          <div>
            <label for="orientation-${item.user_id}">Orientation Status</label>
            <select id="orientation-${item.user_id}">
              <option value="not_scheduled" ${item.orientation_status === "not_scheduled" ? "selected" : ""}>not_scheduled</option>
              <option value="scheduled" ${item.orientation_status === "scheduled" ? "selected" : ""}>scheduled</option>
              <option value="completed" ${item.orientation_status === "completed" ? "selected" : ""}>completed</option>
            </select>
          </div>
        </div>

        <div class="decision-block">
          <label for="packet-url-${item.user_id}">Onboarding Packet URL</label>
          <input id="packet-url-${item.user_id}" type="url" value="${item.onboarding_packet_url || ""}" />
        </div>

        <div class="decision-block">
          <label for="instructions-${item.user_id}">Onboarding Instructions</label>
          <textarea id="instructions-${item.user_id}" rows="4">${item.onboarding_instructions || ""}</textarea>
        </div>

        <div class="notes-block">
          <strong>Materials Acknowledged</strong>
          <p>${item.materials_acknowledged_at ? new Date(item.materials_acknowledged_at).toLocaleString() : "Not yet acknowledged by participant."}</p>
        </div>

        <div class="actions">
          <button type="button" data-save-participant="${item.user_id}">Save Participant Update</button>
        </div>
      </article>
    `).join("");
  }

  async function loadApprovedApplications() {
    const { data: approvedApps, error: appsError } = await window.sb
      .from("applications")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (appsError) {
      throw appsError;
    }

    const { data: existingParticipants, error: participantsError } = await window.sb
      .from("participants")
      .select("application_id");

    if (participantsError) {
      throw participantsError;
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
  }

  async function loadExistingParticipants() {
    const { data, error } = await window.sb
      .from("participants")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    renderExistingParticipants(data || []);
  }

  async function loadAllParticipantData() {
    message.textContent = "Loading participant management data...";
    message.className = "message";

    try {
      await loadApprovedApplications();
      await loadExistingParticipants();
      message.textContent = "Participant management data loaded successfully.";
      message.className = "message success";
    } catch (error) {
      console.error(error);
      message.textContent = error.message || "Failed to load participant data.";
      message.className = "message error";
    }
  }

  async function createParticipantFromApplication(application) {
    const group_name = document.getElementById(`create-group-${application.id}`)?.value || "";
    const scenario_name = document.getElementById(`create-scenario-${application.id}`)?.value || "";
    const wave_name = document.getElementById(`create-wave-${application.id}`)?.value || "";

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

    let response;
    let result;

    try {
      response = await fetch(functionUrl, {
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
    } catch (networkError) {
      console.error(networkError);
      message.textContent = `Network error: ${networkError.message}`;
      message.className = "message error";
      return;
    }

    try {
      result = await response.json();
    } catch (parseError) {
      message.textContent = `Function returned non-JSON response. HTTP ${response.status}.`;
      message.className = "message error";
      return;
    }

    if (!response.ok) {
      const detail = result?.error || result?.message || JSON.stringify(result);
      message.textContent = `Participant creation failed. HTTP ${response.status}. ${detail}`;
      message.className = "message error";
      return;
    }

    message.textContent = `Participant created successfully for ${application.applicant_email}.`;
    message.className = "message success";
    await loadAllParticipantData();
  }

  async function saveParticipantUpdate(userId) {
    const group_name = document.getElementById(`group-${userId}`)?.value || null;
    const scenario_name = document.getElementById(`scenario-${userId}`)?.value || null;
    const wave_name = document.getElementById(`wave-${userId}`)?.value || null;
    const onboard_status = document.getElementById(`status-${userId}`)?.value || null;
    const is_active = document.getElementById(`active-${userId}`)?.value === "true";
    const nda_status = document.getElementById(`nda-${userId}`)?.value || "not_sent";
    const orientation_status = document.getElementById(`orientation-${userId}`)?.value || "not_scheduled";
    const onboarding_packet_url = document.getElementById(`packet-url-${userId}`)?.value?.trim() || null;
    const onboarding_instructions = document.getElementById(`instructions-${userId}`)?.value?.trim() || null;

    message.textContent = "Saving participant update...";
    message.className = "message";

    const { error: updateError } = await window.sb
      .from("participants")
      .update({
        group_name,
        scenario_name,
        wave_name,
        onboard_status,
        is_active,
        nda_status,
        orientation_status,
        onboarding_packet_url,
        onboarding_instructions
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error(updateError);
      message.textContent = updateError.message;
      message.className = "message error";
      return;
    }

    const { error: logError } = await window.sb
      .from("admin_actions")
      .insert([
        {
          admin_user_id: currentAdmin.id,
          action_type: "update_participant",
          target_table: "participants",
          target_id: userId,
          action_notes: `Updated participant record ${userId}`
        }
      ]);

    if (logError) {
      console.error(logError);
      message.textContent = logError.message;
      message.className = "message error";
      return;
    }

    message.textContent = "Participant updated successfully.";
    message.className = "message success";
    await loadAllParticipantData();
  }

  approvedList.addEventListener("click", async (event) => {
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

  existingList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-save-participant]");
    if (!button) return;

    const userId = button.dataset.saveParticipant;
    if (!userId) return;

    await saveParticipantUpdate(userId);
  });

  refreshBtn?.addEventListener("click", loadAllParticipantData);

  (async () => {
    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireAdminPage();
    if (!context) return;

    currentAdmin = context.profile;
    await loadAllParticipantData();
  })();
});
