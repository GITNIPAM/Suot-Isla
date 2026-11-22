document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementById("login-form");
  const register = document.getElementById("register-form");
  const switchToLogin = document.getElementById("switch-to-login-btn");
  const switchToRegister = document.getElementById("switch-to-register-btn");
  const params = new URLSearchParams(location.search);
  const requestedPage = params.get("redirect");
  const destinations = new Set(["checkout.html", "account.html", "cart.html", "admin.html", "catalog.html", "index.html"]);
  const notice=document.getElementById("auth-redirect-notice");
  const prompts={"checkout.html":"Sign in or create an account to continue to checkout.","account.html":"Sign in to view your orders and saved addresses.","admin.html":"Sign in with your operator account."};
  if(prompts[requestedPage] && Object.hasOwn(prompts,requestedPage)){notice.textContent=prompts[requestedPage];notice.style.display="block";}
  let showRegister = params.get("mode") === "register";
  const status = document.getElementById("account-message");
  const session = document.getElementById("active-session-box");
  const signOut = document.getElementById("account-sign-out");

  window.SuotStore.bindPhPhoneInput(document.getElementById("reg-phone"), document.getElementById("reg-phone-hint"));
  const regPassInput = document.getElementById("reg-password");
  const regPassHint = document.getElementById("reg-pass-hint");
  document.querySelectorAll("[data-toggle-pass]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = document.getElementById(btn.getAttribute("data-toggle-pass"));
      if (!target) return;
      const showing = target.type === "text";
      target.type = showing ? "password" : "text";
      btn.textContent = showing ? "Show" : "Hide";
      btn.setAttribute("aria-label", showing ? "Show password" : "Hide password");
    });
  });

  regPassInput.addEventListener("input", () => {
    const len = regPassInput.value.length;
    if (!len) {
      regPassHint.textContent = "Enter at least 8 characters.";
      regPassHint.style.color = "";
    } else if (len < 8) {
      regPassHint.textContent = `${8 - len} more character${8 - len === 1 ? "" : "s"} needed (8 minimum).`;
      regPassHint.style.color = "var(--color-coral-dark)";
    } else {
      regPassHint.textContent = "✓ Password length verified";
      regPassHint.style.color = "var(--color-palm)";
    }
  });

  const sessionPanel = document.getElementById("auth-session");
  const continueLink = document.getElementById("account-continue");

  function showForm(registering) {
    showRegister = registering;
    login.style.display = registering ? "none" : "";
    register.style.display = registering ? "" : "none";
    status.textContent = "";
  }

  function showSession(user) {
    sessionPanel.hidden = !user;
    if (!user) {
      session.textContent = "";
      showForm(showRegister);
      return;
    }
    login.style.display = "none";
    register.style.display = "none";
    session.textContent = "Signed in as " + user.name + " (" + user.email + ")";
    const customer = user.role === "customer";
    const allowed = destinations.has(requestedPage) && !(customer && requestedPage === "admin.html");
    const defaultPage = customer ? "account.html" : "admin.html";
    continueLink.href = allowed ? requestedPage : defaultPage;
  }

  async function request(body, url = "api/account.php") {
    const options = body ? {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Suot-Request": "account" },
      body: JSON.stringify(body)
    } : {};
    const response = await fetch(url, options);
    const result = await response.json().catch(() => null);
    if (!response.ok || !result) {
      throw new Error(result?.message || "Could not connect to the account service.");
    }
    return result.user;
  }

  switchToLogin.addEventListener("click", () => {
    showForm(false);
    login.querySelector("input").focus();
  });
  switchToRegister.addEventListener("click", () => {
    showForm(true);
    register.querySelector("input").focus();
  });
  showForm(showRegister);

  for (const [form, action] of [[login, "login"], [register, "register"]]) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      for (const alert of document.querySelectorAll("#login-auth-alert,#register-auth-alert")) alert.style.display="none";
      const button = form.querySelector("[type=submit]");
      button.disabled = true;
      status.textContent = "";
      try {
        const user = await request({ ...Object.fromEntries(new FormData(form)), action }, form.action);
        showSession(user);
        if (user && destinations.has(requestedPage)) location.assign(continueLink.href);
        form.reset();
        status.textContent = action === "register" ? "Your account was created." : "You’re signed in.";
      } catch (error) {
        const alert=document.getElementById(action==="login" ? "login-auth-alert" : "register-auth-alert");
        alert.textContent=error.message;
        alert.style.display="block";
      } finally {
        button.disabled = false;
      }
    });
  }

  signOut.addEventListener("click", async () => {
    signOut.disabled = true;
    try {
      await request({ action: "logout" });
      showSession(null);
      status.textContent = "You’re signed out.";
    } catch (error) {
      status.textContent = error.message;
    } finally {
      signOut.disabled = false;
    }
  });

  request().then(user => {
    if (user) showSession(user);
  }).catch(() => {
    status.textContent = "Could not check your account session.";
  });
});
