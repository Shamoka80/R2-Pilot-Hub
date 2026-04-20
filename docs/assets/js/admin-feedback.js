document.addEventListener("DOMContentLoaded", () => {
  const FEEDBACK_KIND_LABELS = {
    issue: "Issue",
    finding: "Finding",
    suggestion: "Suggestion",
    request: "Request"
  };

  const ADMIN_STATUS_OPTIONS = ["new", "triaging", "in_review", "routed", "resolved", "closed", "deferred"];

  const list = document.getElementById("admin-feedback-list");
  const message = document.getElementById("admin-feedback-message");
  const refreshBtn = document.getElementById("refresh-feedback-page");

  if (!window.sb || !list) return;

  let currentAdminUserId = null;

  function formatFeedbackKind(kind) {
    return FEEDBACK_KIND_LABELS[kind] || "Unknown";
  }

  function formatTimestamp(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
  }

  function renderItems(items) {
    if (!items.length) {
      list.innerHTML = `<div class="placeholder">No feedback items found.</div>`;
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="item-card" data-id="${item.id}">
        <div class="item-header">
          <h3>${item.title}</h3>
          <span class="badge">${formatFeedbackKind(item.kind)}</span>
        </div>

        <div class="meta">
          <div><strong>Submitted By:</strong> ${item.profiles?.full_name || "—"} (${item.profiles?.email || "—"})</div>
          <div><strong>R2 Ready Area:</strong> ${item.r2_ready_area || "unspecified"}</div>
          <div><strong>Severity:</strong> ${item.severity}</div>
          <div><strong>Participant Status:</strong> ${item.status}</div>
          <div><strong>Admin Status:</strong> ${item.admin_status || "new"}</div>
          <div><strong>Admin Status Updated:</strong> ${formatTimestamp(item.admin_status_updated_at)}</div>
          <div><strong>Admin Status Updated By:</strong> ${item.admin_profile?.full_name || item.admin_profile?.email || "—"}</div>
          <div><strong>Created:</strong> ${new Date(item.created_at).toLocaleString()}</div>
          <div><strong>Updated:</strong> ${formatTimestamp(item.updated_at)}</div>
        </div>

        <div class="notes-block">
          <strong>Participant Details</strong>
          <p>${item.details}</p>
        </div>

        <div class="notes-block">
          <strong>Expected Behavior</strong>
          <p>${item.expected_behavior || "—"}</p>
        </div>

        <div class="notes-block">
          <strong>Actual Behavior</strong>
          <p>${item.actual_behavior || "—"}</p>
        </div>

        <div class="notes-block">
          <strong>Reproduction Steps</strong>
          <p>${item.reproduction_steps || "—"}</p>
        </div>

        <div class="field-grid">
          <div>
            <label for="severity-${item.id}">Update Severity</label>
            <select id="severity-${item.id}">
              <option value="low" ${item.severity === "low" ? "selected" : ""}>Low</option>
              <option value="medium" ${item.severity === "medium" ? "selected" : ""}>Medium</option>
              <option value="high" ${item.severity === "high" ? "selected" : ""}>High</option>
            </select>
          </div>

          <div>
            <label for="admin-status-${item.id}">Update Admin Status</label>
            <select id="admin-status-${item.id}">
              ${ADMIN_STATUS_OPTIONS.map((statusOption) => `
                <option value="${statusOption}" ${item.admin_status === statusOption ? "selected" : ""}>${statusOption}</option>
              `).join("")}
            </select>
          </div>
        </div>

        <div class="decision-block">
          <label for="admin-notes-${item.id}">Admin Notes</label>
          <textarea id="admin-notes-${item.id}" rows="4">${item.admin_notes || ""}</textarea>
        </div>

        <div class="actions">
          <button type="button" data-save-feedback="${item.id}" data-current-admin-status="${item.admin_status || "new"}">Save Update</button>
        </div>
      </article>
    `).join("");
  }

  async function loadFeedbackItems() {
    message.textContent = "Loading feedback items...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("feedback_items")
      .select(`
        *,
        profiles:submitted_by (
          full_name,
          email
        ),
        admin_profile:admin_status_updated_by (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    renderItems(data || []);
    message.textContent = `Loaded ${data?.length || 0} feedback item(s).`;
    message.className = "message success";
  }

  async function saveFeedbackUpdate(itemId, previousAdminStatus) {
    const severity = document.getElementById(`severity-${itemId}`)?.value;
    const adminStatus = document.getElementById(`admin-status-${itemId}`)?.value;
    const adminNotes = document.getElementById(`admin-notes-${itemId}`)?.value?.trim() || null;

    message.textContent = "Saving update...";
    message.className = "message";

    const updates = {
      severity,
      admin_status: adminStatus,
      admin_notes: adminNotes
    };

    if (adminStatus !== previousAdminStatus) {
      updates.admin_status_updated_at = new Date().toISOString();
      updates.admin_status_updated_by = currentAdminUserId;
    }

    const { error } = await window.sb
      .from("feedback_items")
      .update(updates)
      .eq("id", itemId);

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    message.textContent = "Feedback item updated successfully.";
    message.className = "message success";
    await loadFeedbackItems();
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-save-feedback]");
    if (!button) return;

    const itemId = button.dataset.saveFeedback;
    const previousAdminStatus = button.dataset.currentAdminStatus || "new";
    if (!itemId) return;

    await saveFeedbackUpdate(itemId, previousAdminStatus);
  });

  refreshBtn?.addEventListener("click", loadFeedbackItems);

  (async () => {
    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireAdminPage();
    if (!context) return;
    currentAdminUserId = context.user.id;

    await loadFeedbackItems();
  })();
});
