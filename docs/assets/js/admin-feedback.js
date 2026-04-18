document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("admin-feedback-list");
  const message = document.getElementById("admin-feedback-message");
  const refreshBtn = document.getElementById("refresh-feedback-page");

  if (!window.sb || !list) return;



  function renderItems(items) {
    if (!items.length) {
      list.innerHTML = `<div class="placeholder">No feedback items found.</div>`;
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="item-card" data-id="${item.id}">
        <div class="item-header">
          <h3>${item.title}</h3>
          <span class="badge">${item.kind}</span>
        </div>

        <div class="meta">
          <div><strong>Submitted By:</strong> ${item.profiles?.full_name || "—"} (${item.profiles?.email || "—"})</div>
          <div><strong>Severity:</strong> ${item.severity}</div>
          <div><strong>Status:</strong> ${item.status}</div>
          <div><strong>Created:</strong> ${new Date(item.created_at).toLocaleString()}</div>
        </div>

        <div class="notes-block">
          <strong>Participant Details</strong>
          <p>${item.details}</p>
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
            <label for="status-${item.id}">Update Status</label>
            <select id="status-${item.id}">
              <option value="open" ${item.status === "open" ? "selected" : ""}>Open</option>
              <option value="reviewing" ${item.status === "reviewing" ? "selected" : ""}>Reviewing</option>
              <option value="resolved" ${item.status === "resolved" ? "selected" : ""}>Resolved</option>
              <option value="closed" ${item.status === "closed" ? "selected" : ""}>Closed</option>
            </select>
          </div>
        </div>

        <div class="decision-block">
          <label for="admin-notes-${item.id}">Admin Notes</label>
          <textarea id="admin-notes-${item.id}" rows="4">${item.admin_notes || ""}</textarea>
        </div>

        <div class="actions">
          <button type="button" data-save-feedback="${item.id}">Save Update</button>
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

  async function saveFeedbackUpdate(itemId) {
    const severity = document.getElementById(`severity-${itemId}`)?.value;
    const status = document.getElementById(`status-${itemId}`)?.value;
    const adminNotes = document.getElementById(`admin-notes-${itemId}`)?.value?.trim() || null;

    message.textContent = "Saving update...";
    message.className = "message";

    const { error } = await window.sb
      .from("feedback_items")
      .update({
        severity,
        status,
        admin_notes: adminNotes
      })
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
    if (!itemId) return;

    await saveFeedbackUpdate(itemId);
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

    await loadFeedbackItems();
  })();
});
