document.addEventListener("DOMContentLoaded", () => {
  const FEEDBACK_KIND_LABELS = {
    issue: "Issue",
    finding: "Finding",
    suggestion: "Suggestion",
    request: "Request"
  };

  const message = document.getElementById("admin-dashboard-message");
  const content = document.getElementById("admin-dashboard-content");
  const refreshBtn = document.getElementById("refresh-admin-dashboard");
  const signoutBtn = document.getElementById("admin-dashboard-signout");

  if (!window.sb || !content) return;

  function countBy(items, key) {
    return items.reduce((acc, item) => {
      const value = item[key] || "unknown";
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});
  }

  function renderCountList(title, counts) {
    const entries = Object.entries(counts);

    if (!entries.length) {
      return `
        <article class="item-card">
          <h3>${title}</h3>
          <div class="placeholder">No data available.</div>
        </article>
      `;
    }

    return `
      <article class="item-card">
        <h3>${title}</h3>
        <div class="mini-list">
          ${entries
            .map(
              ([label, value]) => `
            <div class="mini-list-row">
              <span>${label}</span>
              <strong>${value}</strong>
            </div>
          `,
            )
            .join("")}
        </div>
      </article>
    `;
  }

  function countFeedbackKinds(items) {
    return items.reduce((acc, item) => {
      const kind = item.kind;
      const label = FEEDBACK_KIND_LABELS[kind] || "Unknown";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {});
  }

  function renderRecentApplications(items) {
    if (!items.length) {
      return `<div class="placeholder">No recent applications.</div>`;
    }

    return `
      <div class="mini-list">
        ${items
          .map(
            (item) => `
          <div class="mini-list-row">
            <span>${item.applicant_name} — ${item.status}</span>
            <strong>${new Date(item.created_at).toLocaleDateString()}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  function renderRecentFeedback(items) {
    if (!items.length) {
      return `<div class="placeholder">No recent feedback items.</div>`;
    }

    return `
      <div class="mini-list">
        ${items
          .map(
            (item) => `
          <div class="mini-list-row">
            <span>${item.title} — ${item.status}</span>
            <strong>${new Date(item.created_at).toLocaleDateString()}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  function renderRecentAdminActions(items) {
    if (!items.length) {
      return `<div class="placeholder">No recent admin actions.</div>`;
    }

    return `
      <div class="mini-list">
        ${items
          .map(
            (item) => `
          <div class="mini-list-row">
            <span>${item.action_type}</span>
            <strong>${new Date(item.created_at).toLocaleDateString()}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  function renderRecentProgress(items) {
    if (!items.length) {
      return `<div class="placeholder">No recent progress updates.</div>`;
    }

    return `
      <div class="mini-list">
        ${items
          .map(
            (item) => `
          <div class="mini-list-row">
            <span>${item.profiles?.full_name || item.profiles?.email || "Participant"} — ${item.progress_stage}</span>
            <strong>${item.percent_complete}%</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  function renderRecentAcknowledgements(items) {
    if (!items.length) {
      return `<div class="placeholder">No onboarding acknowledgements yet.</div>`;
    }

    return `
      <div class="mini-list">
        ${items
          .map(
            (item) => `
          <div class="mini-list-row">
            <span>${item.profiles?.full_name || item.profiles?.email || "Participant"}</span>
            <strong>${new Date(item.materials_acknowledged_at).toLocaleDateString()}</strong>
          </div>
        `,
          )
          .join("")}
      </div>
    `;
  }

  async function loadDashboard() {
    message.textContent = "Loading dashboard data...";
    message.className = "message";

    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireAdminPage();
    if (!context) return;
    const admin = context.profile;

    const { data: applications, error: applicationsError } = await window.sb
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (applicationsError) {
      console.error(applicationsError);
      message.textContent = applicationsError.message;
      message.className = "message error";
      return;
    }

    const { data: participants, error: participantsError } = await window.sb
      .from("participants")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (participantsError) {
      console.error(participantsError);
      message.textContent = participantsError.message;
      message.className = "message error";
      return;
    }

    const { data: feedbackItems, error: feedbackError } = await window.sb
      .from("feedback_items")
      .select(`
        *,
        profiles:submitted_by (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (feedbackError) {
      console.error(feedbackError);
      message.textContent = feedbackError.message;
      message.className = "message error";
      return;
    }

    const { data: participantProgress, error: progressError } = await window.sb
      .from("participant_progress")
      .select(`
        *,
        profiles:participant_user_id (
          full_name,
          email
        )
      `)
      .order("updated_at", { ascending: false });

    if (progressError) {
      console.error(progressError);
      message.textContent = progressError.message;
      message.className = "message error";
      return;
    }

    const { data: adminActions, error: actionsError } = await window.sb
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (actionsError) {
      console.error(actionsError);
      message.textContent = actionsError.message;
      message.className = "message error";
      return;
    }

    const applicationCounts = countBy(applications || [], "status");
    const participantStatusCounts = countBy(participants || [], "onboard_status");
    const participantWaveCounts = countBy(participants || [], "wave_name");
    const feedbackStatusCounts = countBy(feedbackItems || [], "status");
    const feedbackSeverityCounts = countBy(feedbackItems || [], "severity");
    const feedbackKindCounts = countFeedbackKinds(feedbackItems || []);
    const progressStageCounts = countBy(participantProgress || [], "progress_stage");
    const ndaStatusCounts = countBy(participants || [], "nda_status");
    const orientationStatusCounts = countBy(participants || [], "orientation_status");

    const activeParticipants = (participants || []).filter((p) => p.is_active).length;
    const inactiveParticipants = (participants || []).filter((p) => !p.is_active).length;
    const blockedProgressCount = (participantProgress || []).filter(
      (p) => p.progress_stage === "blocked",
    ).length;
    const completedProgressCount = (participantProgress || []).filter(
      (p) => p.progress_stage === "completed",
    ).length;
    const acknowledgedCount = (participants || []).filter((p) => p.materials_acknowledged_at).length;
    const ndaCompleteCount = (participants || []).filter((p) => p.nda_status === "complete").length;
    const orientationCompleteCount = (participants || []).filter(
      (p) => p.orientation_status === "completed",
    ).length;

    const recentAcknowledgements = (participants || [])
      .filter((p) => p.materials_acknowledged_at)
      .sort((a, b) => new Date(b.materials_acknowledged_at) - new Date(a.materials_acknowledged_at))
      .slice(0, 5);

    content.innerHTML = `
      <section class="summary-grid">
        <article class="metric-card">
          <div class="metric-label">Applications</div>
          <div class="metric-value">${applications?.length || 0}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Pending Applications</div>
          <div class="metric-value">${applicationCounts.pending || 0}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Participants</div>
          <div class="metric-value">${participants?.length || 0}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Active Participants</div>
          <div class="metric-value">${activeParticipants}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Inactive Participants</div>
          <div class="metric-value">${inactiveParticipants}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Feedback Items</div>
          <div class="metric-value">${feedbackItems?.length || 0}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Progress Records</div>
          <div class="metric-value">${participantProgress?.length || 0}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Blocked Progress</div>
          <div class="metric-value">${blockedProgressCount}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Completed Progress</div>
          <div class="metric-value">${completedProgressCount}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Materials Acknowledged</div>
          <div class="metric-value">${acknowledgedCount}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">NDA Complete</div>
          <div class="metric-value">${ndaCompleteCount}</div>
        </article>

        <article class="metric-card">
          <div class="metric-label">Orientation Completed</div>
          <div class="metric-value">${orientationCompleteCount}</div>
        </article>
      </section>

      <section class="card-grid">
        ${renderCountList("Application Status Breakdown", applicationCounts)}
        ${renderCountList("Participant Onboarding Breakdown", participantStatusCounts)}
        ${renderCountList("Participant Wave Breakdown", participantWaveCounts)}
        ${renderCountList("Progress Stage Breakdown", progressStageCounts)}
        ${renderCountList("NDA Status Breakdown", ndaStatusCounts)}
        ${renderCountList("Orientation Status Breakdown", orientationStatusCounts)}
        ${renderCountList("Feedback Status Breakdown", feedbackStatusCounts)}
        ${renderCountList("Feedback Severity Breakdown", feedbackSeverityCounts)}
        ${renderCountList("Feedback Type Breakdown", feedbackKindCounts)}
      </section>

      <section class="card-grid">
        <article class="item-card">
          <h3>Recent Applications</h3>
          ${renderRecentApplications((applications || []).slice(0, 5))}
        </article>

        <article class="item-card">
          <h3>Recent Feedback</h3>
          ${renderRecentFeedback((feedbackItems || []).slice(0, 5))}
        </article>

        <article class="item-card">
          <h3>Recent Progress Updates</h3>
          ${renderRecentProgress((participantProgress || []).slice(0, 5))}
        </article>

        <article class="item-card">
          <h3>Recent Acknowledgements</h3>
          ${renderRecentAcknowledgements(recentAcknowledgements)}
        </article>

        <article class="item-card">
          <h3>Recent Admin Actions</h3>
          ${renderRecentAdminActions(adminActions || [])}
        </article>
      </section>
    `;

    message.textContent = `Dashboard loaded successfully for ${admin.full_name || admin.email}.`;
    message.className = "message success";
  }

  refreshBtn?.addEventListener("click", loadDashboard);

  signoutBtn?.addEventListener("click", async () => {
    await window.sb.auth.signOut();
    window.location.href = "./admin-login.html";
  });

  loadDashboard();
});
