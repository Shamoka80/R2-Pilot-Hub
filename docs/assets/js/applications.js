document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("applications-list");
  const message = document.getElementById("applications-message");
  const refreshBtn = document.getElementById("refresh-applications");
  const signoutBtn = document.getElementById("admin-signout");

  if (!window.sb || !list) return;

  let currentAdmin = null;

  function normalizeQualificationNote(rawNote) {
    return (rawNote || "").trim();
  }

  async function resolveStatusAndQualificationNote(applicationId, requestedStatus) {
    const notesEl = document.getElementById(`decision-${applicationId}`);
    const existingNote = normalizeQualificationNote(notesEl ? notesEl.value : "");

    if (existingNote) {
      return { finalStatus: requestedStatus, qualificationNote: existingNote };
    }

    const shouldKeepPending = window.confirm(
      "No qualification note is present. Click OK to keep this application as pending, or Cancel to provide a qualification note and continue."
    );

    if (shouldKeepPending) {
      return { finalStatus: "pending", qualificationNote: null };
    }

    const promptedNote = window.prompt(
      `Please enter a qualification note before setting status to "${requestedStatus}".`,
      ""
    );
    const qualificationNote = normalizeQualificationNote(promptedNote);

    if (!qualificationNote) {
      return null;
    }

    if (notesEl) {
      notesEl.value = qualificationNote;
    }

    return { finalStatus: requestedStatus, qualificationNote };
  }

  function badgeClass(status) {
    if (status === "approved") return "badge success";
    if (status === "rejected") return "badge error";
    return "badge";
  }

  function renderApplications(items) {
    if (!items.length) {
      list.innerHTML = `<div class="placeholder">No applications found.</div>`;
      return;
    }

    list.innerHTML = items.map((item) => {
      const reviewed = item.reviewed_at
        ? new Date(item.reviewed_at).toLocaleString()
        : "Not yet reviewed";

      const decisionNotes = item.admin_decision_notes || "";

      return `
        <article class="item-card" data-id="${item.id}">
          <div class="item-header">
            <h3>${item.applicant_name}</h3>
            <span class="${badgeClass(item.status)}">${item.status}</span>
          </div>

          <div class="meta">
            <div><strong>Email:</strong> ${item.applicant_email}</div>
            <div><strong>Organization:</strong> ${item.organization_name || "—"}</div>
            <div><strong>Group:</strong> ${item.group_interest || "—"}</div>
            <div><strong>Scenario:</strong> ${item.scenario_context || "—"}</div>
            <div><strong>Submitted:</strong> ${new Date(item.created_at).toLocaleString()}</div>
            <div><strong>Reviewed:</strong> ${reviewed}</div>
          </div>

          <div class="notes-block">
            <strong>Applicant Notes</strong>
            <p>${item.notes || "—"}</p>
          </div>

          <div class="decision-block">
            <label for="decision-${item.id}">Admin Decision Notes</label>
            <textarea id="decision-${item.id}" rows="4">${decisionNotes}</textarea>
          </div>

          <div class="actions">
            <button type="button" data-action="approve" data-id="${item.id}">Approve</button>
            <button type="button" data-action="reject" data-id="${item.id}" class="danger-btn">Reject</button>
          </div>
        </article>
      `;
    }).join("");
  }

  async function loadApplications() {
    message.textContent = "Loading applications...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      list.innerHTML = "";
      return;
    }

    renderApplications(data || []);
    message.textContent = `Loaded ${data?.length || 0} application(s).`;
    message.className = "message success";
  }

  async function logAdminAction(actionType, targetId, notes) {
    await window.sb.from("admin_actions").insert([
      {
        admin_user_id: currentAdmin.id,
        action_type: actionType,
        target_table: "applications",
        target_id: targetId,
        action_notes: notes || null
      }
    ]);
  }

  async function updateApplicationStatus(applicationId, status) {
    const resolution = await resolveStatusAndQualificationNote(applicationId, status);
    if (!resolution) {
      message.textContent = "Qualification note is required to approve or reject this application.";
      message.className = "message error";
      return;
    }

    const { finalStatus, qualificationNote } = resolution;
    const actionLabel = finalStatus === "approved"
      ? "Approving"
      : finalStatus === "rejected"
        ? "Rejecting"
        : "Setting to pending";

    message.textContent = `${actionLabel} application...`;
    message.className = "message";

    const { error } = await window.sb
      .from("applications")
      .update({
        status: finalStatus,
        reviewed_by: currentAdmin.id,
        reviewed_at: new Date().toISOString(),
        admin_decision_notes: qualificationNote || null
      })
      .eq("id", applicationId);

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    await logAdminAction(
      finalStatus === "approved"
        ? "approve_application"
        : finalStatus === "rejected"
          ? "reject_application"
          : "set_application_pending",
      applicationId,
      qualificationNote
    );

    await loadApplications();
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    if (!id) return;

    if (action === "approve") {
      await updateApplicationStatus(id, "approved");
    }

    if (action === "reject") {
      await updateApplicationStatus(id, "rejected");
    }
  });

  refreshBtn?.addEventListener("click", loadApplications);

  signoutBtn?.addEventListener("click", async () => {
    await window.sb.auth.signOut();
    window.location.href = "./admin-login.html";
  });

  (async () => {
    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireAdminPage();
    if (!context) return;

    currentAdmin = context.profile;
    await loadApplications();
  })();
});
