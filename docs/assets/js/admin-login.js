document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-login-form");
  const message = document.getElementById("admin-login-message");

  if (!form || !window.sb) return;

  async function verifyAdminAndRedirect() {
    const { data: userData } = await window.sb.auth.getUser();
    const user = userData?.user;

    if (!user) return;

    const { data: profile, error } = await window.sb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || !profile || profile.role !== "admin") {
      await window.sb.auth.signOut();
      message.textContent = "Access denied. This account is not an administrator.";
      message.className = "message error";
      return;
    }

    window.location.href = "./applications.html";
  }

  verifyAdminAndRedirect();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    message.textContent = "Signing in...";
    message.className = "message";

    const formData = new FormData(form);
    const email = formData.get("admin_email")?.toString().trim();
    const password = formData.get("admin_password")?.toString();

    const { error } = await window.sb.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error(error);
      message.textContent = error.message;
      message.className = "message error";
      return;
    }

    await verifyAdminAndRedirect();
  });
});
