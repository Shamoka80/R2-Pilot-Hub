document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("participant-feedback-message");
  const list = document.getElementById("participant-feedback-list");
  const refreshBtn = document.getElementById("refresh-participant-feedback");

  if (!window.sb || !list) return;

  async function requireParticipantSession() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "./login.html";
      return null;
    }

    return user;
  }

  function badgeClass(status) {
    if (status === "resolved") return "badge success";
    if (status === "closed") return "badge";
    if (status === "reviewing") return "badge";
    return "badge error";
  }

  function renderFeedbackItems(items) {
    if (!items.length) {
      list.innerHTML = `<div class="placeholder">You have not submitted any feedback items yet.</div>`;
      return;
    }

    list.innerHTML = items.map((item) => `
      <article class="item-card">
        <div class="item-header">
          <h3>${item.title}</h3>
          <span class="${badgeClass(item.status)}">${item.status}</span>
        </div>

        <div class="meta">
          <div><strong>Type:</strong> ${item.kind}</div>
          <div><strong>Severity:</strong> ${item.severity}</div>
          <div><strong>Created:</strong> ${new Date(item.created_at).toLocaleString()}</div>
        </div>

        <div class="notes-block">
          <strong>Your Submission</strong>
          <p>${item.details}</p>
        </div>

        <div class="notes-block">
          <strong>Admin Notes</strong>
          <p>${item.admin_notes || "No admin notes have been added yet."}</p>
        </div>
      </article>
    `).join("");
  }

  async function loadFeedbackHistory() {
    message.textContent = "Loading your feedback history...";
    message.className = "message";

    const user = await requireParticipantSession();
    if (!user) return;

    const { data, error } = await window.sb
      .from("feedback_items")
      .select("*")
      .eq("submitted_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    renderFeedbackItems(data || []);
    message.textContent = `Loaded ${data?.length || 0} feedback item(s).`;
    message.className = "message success";
  }

  refreshBtn?.addEventListener("click", loadFeedbackHistory);

  loadFeedbackHistory();
});
