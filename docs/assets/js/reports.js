document.addEventListener("DOMContentLoaded", () => {
  const message = document.getElementById("reports-message");
  const exportApplicationsBtn = document.getElementById("export-applications");
  const exportParticipantsBtn = document.getElementById("export-participants");
  const exportProgressBtn = document.getElementById("export-progress");
  const exportFeedbackBtn = document.getElementById("export-feedback");
  const exportAdminActionsBtn = document.getElementById("export-admin-actions");

  if (!window.sb) return;

  async function requireAdmin() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) {
      window.location.href = "./admin-login.html";
      return null;
    }

    const { data: profile, error } = await window.sb
      .from("profiles")
      .select("id, role, email")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      await window.sb.auth.signOut();
      window.location.href = "./admin-login.html";
      return null;
    }

    return profile;
  }

  function escapeCsvValue(value) {
    if (value === null || value === undefined) return "";
    const text = String(value).replace(/"/g, '""');
    if (/[",\n]/.test(text)) {
      return `"${text}"`;
    }
    return text;
  }

  function convertRowsToCsv(rows) {
    if (!rows.length) {
      return "";
    }

    const headers = Object.keys(rows[0]);
    const headerLine = headers.map(escapeCsvValue).join(",");
    const bodyLines = rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(",")
    );

    return [headerLine, ...bodyLines].join("\n");
  }

  function downloadCsv(filename, rows) {
    const csv = convertRowsToCsv(rows);

    if (!csv) {
      message.textContent = "No data was available for export.";
      message.className = "message error";
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function getDateStamp() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function exportApplications() {
    message.textContent = "Exporting applications...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("applications")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    downloadCsv(`applications-${getDateStamp()}.csv`, data || []);
    message.textContent = "Applications export completed.";
    message.className = "message success";
  }

  async function exportParticipants() {
    message.textContent = "Exporting participants...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("participants")
      .select(`
        *,
        profiles:user_id (
          email,
          full_name,
          role
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    const flattened = (data || []).map((item) => ({
      user_id: item.user_id,
      email: item.profiles?.email || "",
      full_name: item.profiles?.full_name || "",
      role: item.profiles?.role || "",
      application_id: item.application_id,
      group_name: item.group_name,
      scenario_name: item.scenario_name,
      wave_name: item.wave_name,
      onboard_status: item.onboard_status,
      is_active: item.is_active,
      approved_at: item.approved_at,
      created_at: item.created_at
    }));

    downloadCsv(`participants-${getDateStamp()}.csv`, flattened);
    message.textContent = "Participants export completed.";
    message.className = "message success";
  }

  async function exportProgress() {
    message.textContent = "Exporting participant progress...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("participant_progress")
      .select(`
        *,
        profiles:participant_user_id (
          email,
          full_name
        )
      `)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    const flattened = (data || []).map((item) => ({
      participant_user_id: item.participant_user_id,
      email: item.profiles?.email || "",
      full_name: item.profiles?.full_name || "",
      progress_stage: item.progress_stage,
      percent_complete: item.percent_complete,
      participant_note: item.participant_note,
      admin_note: item.admin_note,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    downloadCsv(`participant-progress-${getDateStamp()}.csv`, flattened);
    message.textContent = "Participant progress export completed.";
    message.className = "message success";
  }

  async function exportFeedback() {
    message.textContent = "Exporting feedback...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("feedback_items")
      .select(`
        *,
        profiles:submitted_by (
          email,
          full_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    const flattened = (data || []).map((item) => ({
      id: item.id,
      submitted_by: item.submitted_by,
      email: item.profiles?.email || "",
      full_name: item.profiles?.full_name || "",
      kind: item.kind,
      title: item.title,
      details: item.details,
      severity: item.severity,
      status: item.status,
      admin_notes: item.admin_notes,
      created_at: item.created_at
    }));

    downloadCsv(`feedback-${getDateStamp()}.csv`, flattened);
    message.textContent = "Feedback export completed.";
    message.className = "message success";
  }

  async function exportAdminActions() {
    message.textContent = "Exporting admin actions...";
    message.className = "message";

    const { data, error } = await window.sb
      .from("admin_actions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    downloadCsv(`admin-actions-${getDateStamp()}.csv`, data || []);
    message.textContent = "Admin actions export completed.";
    message.className = "message success";
  }

  async function initializeReportsPage() {
    message.textContent = "Verifying admin access...";
    message.className = "message";

    const admin = await requireAdmin();
    if (!admin) return;

    message.textContent = `Reports page ready for ${admin.email}.`;
    message.className = "message success";
  }

  exportApplicationsBtn?.addEventListener("click", exportApplications);
  exportParticipantsBtn?.addEventListener("click", exportParticipants);
  exportProgressBtn?.addEventListener("click", exportProgress);
  exportFeedbackBtn?.addEventListener("click", exportFeedback);
  exportAdminActionsBtn?.addEventListener("click", exportAdminActions);

  initializeReportsPage();
});
