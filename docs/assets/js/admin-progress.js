document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("admin-progress-list");
  const message = document.getElementById("admin-progress-message");
  const refreshBtn = document.getElementById("refresh-progress-page");

  if (!window.sb || !list) return;



  function renderProgressItems(items) {
    if (!items.length) {
      list.innerHTML = `<div class="placeholder">No participant progress records found yet.</div>`;
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="item-card">
        <div class="item-header">
          <h3>${item.profiles?.full_name || "—"}</h3>
          <span class="badge">${item.progress_stage}</span>
        </div>

        <div class="meta">
          <div><strong>Email:</strong> ${item.profiles?.email || "—"}</div>
          <div><strong>Percent Complete:</strong> ${item.percent_complete}%</div>
          <div><strong>Updated:</strong> ${new Date(item.updated_at).toLocaleString()}</div>
        </div>

        <div class="notes-block">
          <strong>Participant Note</strong>
          <p>${item.participant_note || "No participant note provided."}</p>
        </div>

        <div class="field-grid">
          <div>
            <label for="progress-stage-${item.participant_user_id}">Update Stage</label>
            <select id="progress-stage-${item.participant_user_id}">
              <option value="not_started" ${item.progress_stage === "not_started" ? "selected" : ""}>not_started</option>
              <option value="started" ${item.progress_stage === "started" ? "selected" : ""}>started</option>
              <option value="in_progress" ${item.progress_stage === "in_progress" ? "selected" : ""}>in_progress</option>
              <option value="blocked" ${item.progress_stage === "blocked" ? "selected" : ""}>blocked</option>
              <option value="completed" ${item.progress_stage === "completed" ? "selected" : ""}>completed</option>
            </select>
          </div>

          <div>
            <label for="progress-percent-${item.participant_user_id}">Update Percent</label>
            <input
              id="progress-percent-${item.participant_user_id}"
              type="number"
              min="0"
              max="100"
              value="${item.percent_complete}"
            />
          </div>
        </div>

        <div class="decision-block">
          <label for="progress-admin-note-${item.participant_user_id}">Admin Note</label>
          <textarea id="progress-admin-note-${item.participant_user_id}" rows="4">${item.admin_note || ""}</textarea>
        </div>

        <div class="actions">
          <button type="button" data-save-progress="${item.participant_user_id}">Save Progress Update</button>
        </div>
      </article>
    `).join("");
  }

  async function loadProgressRecords() {
    message.textContent = "Loading participant progress...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("participant_progress")
      .select(`
        *,
        profiles:participant_user_id (
          full_name,
          email
        )
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    renderProgressItems(data || []);
    message.textContent = `Loaded ${data?.length || 0} participant progress record(s).`;
    message.className = "message success";
  }

  async function saveProgressUpdate(participantUserId) {
    const progress_stage = document.getElementById(`progress-stage-${participantUserId}`)?.value || "not_started";
    const percent_complete = Number(document.getElementById(`progress-percent-${participantUserId}`)?.value || 0);
    const admin_note = document.getElementById(`progress-admin-note-${participantUserId}`)?.value?.trim() || null;

    message.textContent = "Saving progress update...";
    message.className = "message";

    const { error } = await window.sb
      .from("participant_progress")
      .update({
        progress_stage,
        percent_complete,
        admin_note,
        updated_at: new Date().toISOString()
      })
      .eq("participant_user_id", participantUserId);

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    message.textContent = "Participant progress updated successfully.";
    message.className = "message success";
    await loadProgressRecords();
  }

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-save-progress]");
    if (!button) return;

    const participantUserId = button.dataset.saveProgress;
    if (!participantUserId) return;

    await saveProgressUpdate(participantUserId);
  });

  refreshBtn?.addEventListener("click", loadProgressRecords);

  (async () => {
    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireAdminPage();
    if (!context) return;

    await loadProgressRecords();
  })();
});
