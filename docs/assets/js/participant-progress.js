document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("participant-progress-form");
  const message = document.getElementById("participant-progress-message");
  const adminNoteEl = document.getElementById("participant-admin-progress-note");

  if (!window.sb || !form) return;

  let currentUserId = null;

  async function loadProgress() {
    message.textContent = "Loading your progress...";
    message.className = "message";

    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireParticipantPage();
    if (!context) return;

    currentUserId = context.user.id;

    const { data, error } = await window.sb
      .from("participant_progress")
      .select("*")
      .eq("participant_user_id", currentUserId)
      .maybeSingle();

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    if (data) {
      document.getElementById("progress_stage").value = data.progress_stage || "not_started";
      document.getElementById("percent_complete").value = data.percent_complete ?? 0;
      document.getElementById("participant_note").value = data.participant_note || "";
      adminNoteEl.textContent = data.admin_note || "No admin note is available yet.";
    } else {
      document.getElementById("progress_stage").value = "not_started";
      document.getElementById("percent_complete").value = 0;
      document.getElementById("participant_note").value = "";
      adminNoteEl.textContent = "No admin note is available yet.";
    }

    message.textContent = "Progress loaded successfully.";
    message.className = "message success";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Saving progress...";
    message.className = "message";

    if (!window.AuthGuards) {
      message.textContent = "Access guard is not available.";
      message.className = "message error";
      return;
    }

    const context = await window.AuthGuards.requireParticipantPage();
    if (!context) return;

    const progress_stage = document.getElementById("progress_stage").value;
    const percent_complete = Number(document.getElementById("percent_complete").value || 0);
    const participant_note = document.getElementById("participant_note").value.trim() || null;

    const { error } = await window.sb
      .from("participant_progress")
      .upsert([
        {
          participant_user_id: context.user.id,
          progress_stage,
          percent_complete,
          participant_note,
          updated_at: new Date().toISOString()
        }
      ], { onConflict: "participant_user_id" });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    message.textContent = "Progress saved successfully.";
    message.className = "message success";
    await loadProgress();
  });

  loadProgress();
});
