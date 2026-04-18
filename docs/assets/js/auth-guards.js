(function () {
  if (!window.sb) {
    console.error("Supabase client is not available for auth guards.");
    return;
  }

  async function getSessionContext() {
    const { data: userData, error: userError } = await window.sb.auth.getUser();

    if (userError || !userData?.user) {
      return {
        user: null,
        profile: null,
        participant: null
      };
    }

    const user = userData.user;

    const { data: profile, error: profileError } = await window.sb
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return {
        user,
        profile: null,
        participant: null
      };
    }

    let participant = null;

    if (profile.role === "participant") {
      const { data: participantData } = await window.sb
        .from("participants")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      participant = participantData || null;
    }

    return {
      user,
      profile,
      participant
    };
  }

  async function signOutAndRedirectToParticipantLogin(reason) {
    await window.sb.auth.signOut();
    window.location.href = `./login.html?reason=${encodeURIComponent(reason)}`;
  }

  async function requireParticipantPage() {
    const context = await getSessionContext();

    if (!context.user) {
      window.location.href = "./login.html";
      return null;
    }

    if (context.profile?.role === "admin") {
      window.location.href = "./admin-dashboard.html";
      return null;
    }

    if (context.profile?.role !== "participant") {
      await signOutAndRedirectToParticipantLogin("access");
      return null;
    }

    if (!context.participant) {
      await signOutAndRedirectToParticipantLogin("no_record");
      return null;
    }

    if (!context.participant.is_active) {
      await signOutAndRedirectToParticipantLogin("inactive");
      return null;
    }

    if (context.participant.onboard_status === "archived") {
      await signOutAndRedirectToParticipantLogin("archived");
      return null;
    }

    return context;
  }

  window.AuthGuards = {
    getSessionContext,
    requireParticipantPage
  };
})();
