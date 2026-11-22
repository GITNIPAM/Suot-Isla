/* ==========================================================================
   Suot Isla — Role-Based Admin, Staff & Courier Portal Controller (admin.js)
   Covers Analytics, Action Queue, Inventory CRUD, Orders, Courier, Returns, RBAC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  let activeTab = "analytics";
  let invFilter = "all";
  let invSearch = "";
  let orderFilter = "all";
  let orderSearch = "";
  let uploadedImageDataUrl = null;
  const selectedAdminColor = {};

  const roleSelectEl = document.getElementById("rbac-role-select");
  const roleDescEl = document.getElementById("rbac-role-desc");
  const workspaceEl = document.getElementById("admin-workspace-mount");
  const crudModal = document.getElementById("product-crud-modal");
  const crudForm = document.getElementById("product-crud-form");
  const imageFileInput = document.getElementById("crud-image-file");
  const imagePreviewWrap = document.getElementById("crud-image-preview");
  const imagePreviewImg = document.getElementById("crud-preview-img");

  const confirmModal = document.getElementById("admin-confirm-modal");
  const confirmBadgeEl = document.getElementById("admin-confirm-badge");
  const confirmTitleEl = document.getElementById("admin-confirm-title");
  const confirmBodyEl = document.getElementById("admin-confirm-body");
  const confirmProceedBtn = document.getElementById("admin-confirm-proceed-btn");
  const confirmCancelBtn = document.getElementById("admin-confirm-cancel-btn");
  let pendingConfirmHandler = null;
  let lastConfirmTriggerEl = null;

  const refundModal = document.getElementById("admin-refund-modal");
  const refundForm = document.getElementById("admin-refund-form");
  const refundRetIdEl = document.getElementById("refund-ret-id");
  const refundSummaryEl = document.getElementById("refund-order-summary");
  const refundMethodSel = document.getElementById("refund-method-sel");
  const refundTxnInput = document.getElementById("refund-txn-ref");
  const refundNotesInput = document.getElementById("refund-txn-notes");
  const refundVerifyChk = document.getElementById("refund-verify-checkbox");
  const refundAlertEl = document.getElementById("refund-form-alert");

  const params = new URLSearchParams(window.location.search);
  const isDemoMode = params.get("demo") === "1";
  const currUser = window.SuotStore.getCurrentUser();
  const topbarRoleBadge = document.getElementById("topbar-role-badge");
  const adminSignOutBtn = document.getElementById("admin-signout-btn");
  const adminEmailsTopBtn = document.getElementById("admin-open-emails-btn");

  if (adminSignOutBtn) {
    adminSignOutBtn.style.display = currUser ? "" : "none";
    adminSignOutBtn.addEventListener("click", () => {
      window.SuotStore.logout();
      window.location.href = isDemoMode ? "admin.html?demo=1" : "admin.html";
    });
  }

  if (!currUser || !["admin", "staff", "courier"].includes(currUser.role)) {
    if (topbarRoleBadge) {
      topbarRoleBadge.textContent = currUser ? `ROLE: ${currUser.role.toUpperCase()} (RESTRICTED)` : "OPERATOR SIGN IN";
    }
    if (roleSelectEl) roleSelectEl.disabled = true;
    if (roleDescEl) {
      roleDescEl.textContent = "Sign in with Admin, Staff, or Courier credentials to unlock operations.";
    }
    document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
      btn.disabled = true;
      btn.style.opacity = "0.45";
    });
    if (adminEmailsTopBtn) adminEmailsTopBtn.disabled = true;
    const adminEmailBadge = document.getElementById("admin-email-count");
    if (adminEmailBadge) adminEmailBadge.textContent = "0";

    if (workspaceEl) {
      workspaceEl.innerHTML = `
        <section class="admin-gate-card" id="admin-auth-gate" aria-label="Operations Console Sign In">
          <h2>Operator Sign In</h2>
          <p class="admin-gate-sub">
            ${
              currUser
                ? `Signed in as <strong>${currUser.name}</strong> (Customer). Enter authorized <strong>Admin</strong>, <strong>Staff</strong>, or <strong>Courier</strong> credentials to open back-office operations.`
                : `Restricted to authorized Suot Isla Store Owners, Catalog Staff, and Island Couriers. Sign in with your operator credentials below.`
            }
          </p>

          <form id="admin-login-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="admin-login-email">Operator Email *</label>
              <input type="email" id="admin-login-email" class="form-input" required autocomplete="email" placeholder="admin@suotisla.ph" />
            </div>

            <div class="form-group">
              <label class="form-label" for="admin-login-password">Password *</label>
              <div class="admin-pass-wrap">
                <input type="password" id="admin-login-password" class="form-input" required autocomplete="current-password" placeholder="Enter operator password" />
                <button type="button" class="admin-pass-toggle" id="admin-pass-toggle" aria-label="Show password">Show</button>
              </div>
            </div>

            <div id="admin-login-alert" role="alert" style="display:none;margin-bottom:var(--space-4);padding:0.65rem 0.85rem;border-radius:var(--radius-sm);background:rgba(242,125,99,0.14);border:1px solid var(--color-coral);color:#9f3217;font-size:0.8rem;font-weight:600;"></div>

            <div style="display:flex;gap:0.65rem;flex-wrap:wrap;align-items:center;">
              <button type="submit" class="btn btn-primary" style="flex:1;white-space:nowrap;">
                Sign In →
              </button>
              <a href="index.html" class="btn btn-outline" style="white-space:nowrap;">← Storefront</a>
            </div>
            ${
              currUser
                ? `<div style="margin-top:0.75rem;"><button type="button" class="btn btn-ghost btn-sm" id="admin-gate-cust-signout">Sign out customer account (${currUser.email})</button></div>`
                : ""
            }
          </form>

          <div class="auth-demo-box" id="admin-demo-creds">
            <div class="auth-demo-title">Operator demo accounts (fictional data — click row to prefill)</div>
            <div class="auth-demo-list">
              <button type="button" class="auth-demo-item" data-admin-fill-email="admin@suotisla.ph">
                <span class="auth-demo-role">Admin</span>
                <span class="auth-demo-cred">admin@suotisla.ph / SuotIsla2026!</span>
              </button>
              <button type="button" class="auth-demo-item" data-admin-fill-email="staff@suotisla.ph">
                <span class="auth-demo-role">Staff</span>
                <span class="auth-demo-cred">staff@suotisla.ph / SuotIsla2026!</span>
              </button>
              <button type="button" class="auth-demo-item" data-admin-fill-email="courier@suotisla.ph">
                <span class="auth-demo-role">Courier</span>
                <span class="auth-demo-cred">courier@suotisla.ph / SuotIsla2026!</span>
              </button>
            </div>
          </div>
          ${
            isDemoMode
              ? `
                <div class="admin-demo-bar" id="admin-demo-bar">
                  <span class="admin-demo-bar-label">1-Click Demo Shortcuts (?demo=1)</span>
                  <div class="admin-demo-btns">
                    <button type="button" class="btn btn-outline btn-sm" data-admin-demo-role="admin">Store Admin</button>
                    <button type="button" class="btn btn-outline btn-sm" data-admin-demo-role="staff">Catalog Staff</button>
                    <button type="button" class="btn btn-outline btn-sm" data-admin-demo-role="courier">Island Courier</button>
                  </div>
                </div>
              `
              : ""
          }
        </section>
      `;

      const gateForm = document.getElementById("admin-login-form");
      const gateEmail = document.getElementById("admin-login-email");
      const gatePass = document.getElementById("admin-login-password");
      const gateToggle = document.getElementById("admin-pass-toggle");
      const gateAlert = document.getElementById("admin-login-alert");
      const custSignOut = document.getElementById("admin-gate-cust-signout");

      workspaceEl.querySelectorAll("[data-admin-fill-email]").forEach((rowBtn) => {
        rowBtn.addEventListener("click", () => {
          if (gateEmail) {
            gateEmail.value = rowBtn.getAttribute("data-admin-fill-email") || "";
            gateEmail.classList.remove("is-invalid-field");
          }
          if (gatePass) {
            gatePass.value = "SuotIsla2026!";
            gatePass.classList.remove("is-invalid-field");
          }
          if (gateAlert) gateAlert.style.display = "none";
          window.SuotUI.toast("Operator credentials filled — click Sign In to verify.", "Demo Ready");
        });
      });

      if (gateToggle && gatePass) {
        gateToggle.addEventListener("click", () => {
          const showing = gatePass.type === "text";
          gatePass.type = showing ? "password" : "text";
          gateToggle.textContent = showing ? "Show" : "Hide";
        });
      }

      [gateEmail, gatePass].forEach((inp) => {
        if (!inp) return;
        inp.addEventListener("input", () => {
          inp.classList.remove("is-invalid-field");
          if (gateAlert) {
            gateAlert.style.display = "none";
            gateAlert.textContent = "";
          }
        });
      });

      if (custSignOut) {
        custSignOut.addEventListener("click", () => {
          window.SuotStore.logout();
          window.location.reload();
        });
      }

      if (gateForm) {
        gateForm.addEventListener("submit", (e) => {
          e.preventDefault();
          const emailVal = gateEmail ? gateEmail.value.trim() : "";
          const passVal = gatePass ? gatePass.value : "";
          if (!emailVal || (gateEmail && !gateEmail.checkValidity())) {
            if (gateAlert) {
              gateAlert.textContent = "Enter a valid operator email address.";
              gateAlert.style.display = "block";
            }
            if (gateEmail) {
              gateEmail.classList.add("is-invalid-field");
              gateEmail.focus();
            }
            return;
          }
          if (!passVal) {
            if (gateAlert) {
              gateAlert.textContent = "Enter your operator password.";
              gateAlert.style.display = "block";
            }
            if (gatePass) {
              gatePass.classList.add("is-invalid-field");
              gatePass.focus();
            }
            return;
          }

          const res = window.SuotStore.loginWithCredentials(emailVal, passVal);
          if (!res.ok) {
            if (gateAlert) {
              gateAlert.textContent = res.message;
              gateAlert.style.display = "block";
            }
            const tgt = res.field === "email" ? gateEmail : gatePass;
            if (tgt) {
              tgt.classList.add("is-invalid-field");
              tgt.focus();
            }
            return;
          }

          if (!["admin", "staff", "courier"].includes(res.user.role)) {
            window.SuotStore.logout();
            if (gateAlert) {
              gateAlert.textContent = `Access denied: ${res.user.email} is a Customer account and does not have back-office operator permissions.`;
              gateAlert.style.display = "block";
            }
            return;
          }

          window.location.reload();
        });
      }

      workspaceEl.querySelectorAll("[data-admin-demo-role]").forEach((btn) => {
        btn.addEventListener("click", () => {
          window.SuotStore.loginAsRole(btn.getAttribute("data-admin-demo-role"));
          window.location.reload();
        });
      });
    }
    return;
  }

  const signedInRole = currUser.role;
  let activeRole = signedInRole;
  roleSelectEl.value = activeRole;
  if (signedInRole === "courier") {
    roleSelectEl.disabled = true;
  } else if (signedInRole === "staff") {
    const adminOpt = roleSelectEl.querySelector('option[value="admin"]');
    if (adminOpt) adminOpt.disabled = true;
  }

  const roleDescriptions = {
    admin: "Full analytics, catalog control, returns, and team RBAC.",
    staff: "Catalog & inventory, order fulfillment, courier handoff, and returns.",
    courier: "Active island dispatches, waybills, and delivery confirmation."
  };

  function getProductThumb(product, color) {
    if (!product) return "";
    return window.SuotStore.renderProductVisual(product, color || (product.colors && product.colors[0]));
  }

  function closeConfirmDialog(restoreFocus = false) {
    if (confirmModal) confirmModal.classList.remove("open");
    pendingConfirmHandler = null;
    if (restoreFocus && lastConfirmTriggerEl && lastConfirmTriggerEl.isConnected) {
      lastConfirmTriggerEl.focus();
    }
    lastConfirmTriggerEl = null;
  }

  function countActiveOrdersForProduct(productId) {
    return window.SuotStore.getOrders().filter((ord) => {
      if (ord.status === "Cancelled" || ord.status === "Delivered" || ord.status === "Returned") return false;
      return (ord.items || []).some((item) => item.productId === productId || item.id === productId);
    }).length;
  }

  function renderProductConfirmBody(prod, stockColor, impactItems, impactClass = "") {
    const unitLabel = Number(prod.stock) === 1 ? "unit" : "units";
    const listItems = impactItems.map((line) => `<li>${line}</li>`).join("");
    return `
      <div class="admin-confirm-summary" style="display:flex;align-items:center;gap:0.85rem;">
        <div class="admin-thumb-sm" style="width:52px;height:64px;">${getProductThumb(prod)}</div>
        <div style="min-width:0;">
          <div class="mono" style="font-size:0.74rem;color:var(--text-muted);">${prod.sku} · ${prod.series} Series</div>
          <strong style="display:block;font-size:0.95rem;">${prod.name}</strong>
          <div style="font-size:0.78rem;color:${stockColor};margin-top:3px;">
            ${prod.stock} ${unitLabel} in stock · ${window.SuotStore.formatPrice(prod.price)}
          </div>
        </div>
      </div>
      <ul class="admin-confirm-impact${impactClass ? ` ${impactClass}` : ""}">${listItems}</ul>
    `;
  }

  function openConfirmDialog({
    badge = "CONFIRM",
    badgeClass = "pill-coral",
    title,
    bodyHtml,
    confirmLabel = "Confirm",
    confirmBtnClass = "btn-coral",
    triggerEl = null,
    onConfirm
  }) {
    if (!confirmModal) {
      if (typeof onConfirm === "function") onConfirm();
      return;
    }
    lastConfirmTriggerEl = triggerEl || document.activeElement;
    confirmBadgeEl.className = `pill ${badgeClass}`;
    confirmBadgeEl.textContent = badge;
    confirmTitleEl.textContent = title;
    confirmBodyEl.innerHTML = bodyHtml;
    confirmProceedBtn.className = `btn ${confirmBtnClass} btn-pill`;
    confirmProceedBtn.textContent = confirmLabel;
    pendingConfirmHandler = onConfirm || null;
    confirmModal.classList.add("open");
    requestAnimationFrame(() => {
      if (confirmCancelBtn) confirmCancelBtn.focus();
    });
  }

  if (confirmModal) {
    document.getElementById("close-confirm-modal-btn").addEventListener("click", () => closeConfirmDialog(true));
    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener("click", () => closeConfirmDialog(true));
    }
    confirmModal.addEventListener("click", (e) => {
      if (e.target === confirmModal) closeConfirmDialog(true);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && confirmModal.classList.contains("open")) {
        e.preventDefault();
        closeConfirmDialog(true);
      }
    });
    confirmProceedBtn.addEventListener("click", () => {
      const fn = pendingConfirmHandler;
      closeConfirmDialog(false);
      if (typeof fn === "function") fn();
    });
  }

  function closeRefundModal() {
    if (refundModal) refundModal.classList.remove("open");
  }

  function openRefundModal(returnId) {
    const req = window.SuotStore.getReturns().find((r) => r.returnId === returnId);
    if (!req || !refundModal) return;
    const ord = window.SuotStore.getOrders().find((o) => o.orderNumber === req.orderNumber);
    refundRetIdEl.value = req.returnId;
    refundSummaryEl.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px;">
        <strong class="mono">${req.returnId} · #${req.orderNumber}</strong>
        <strong class="price" style="font-size:1rem;color:var(--color-lagoon-ink);">${window.SuotStore.formatPrice(req.amount)}</strong>
      </div>
      <div style="font-size:0.78rem;color:var(--text-secondary);">
        <strong>${req.customerName}</strong> (${req.customerEmail})<br />
        <span>Original Payment: ${ord ? `${ord.paymentMethod} (${ord.paymentRef})` : "GCash"}</span>
      </div>
    `;
    refundMethodSel.value = ord && ord.paymentMethod === "COD" ? "Cash / Courier Payout" : "GCash Express Refund";
    refundTxnInput.value = "";
    refundTxnInput.classList.remove("is-invalid-field");
    refundNotesInput.value = "";
    refundVerifyChk.checked = false;
    refundAlertEl.style.display = "none";
    refundAlertEl.textContent = "";
    refundModal.classList.add("open");
    if (window.SuotUI && typeof window.SuotUI.enhanceSelects === "function") {
      window.SuotUI.enhanceSelects(refundModal);
    }
    setTimeout(() => refundTxnInput.focus(), 60);
  }

  if (refundModal && refundForm) {
    document.getElementById("close-refund-modal-btn").addEventListener("click", closeRefundModal);
    document.getElementById("cancel-refund-modal-btn").addEventListener("click", closeRefundModal);
    refundModal.addEventListener("click", (e) => {
      if (e.target === refundModal) closeRefundModal();
    });
    refundTxnInput.addEventListener("input", () => {
      refundTxnInput.classList.remove("is-invalid-field");
      refundAlertEl.style.display = "none";
    });
    refundForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const retId = refundRetIdEl.value;
      const res = window.SuotStore.confirmReturnRefund(retId, {
        refundMethod: refundMethodSel.value,
        refundRef: refundTxnInput.value,
        notes: refundNotesInput.value,
        verified: refundVerifyChk.checked
      });
      if (!res.ok) {
        refundAlertEl.textContent = res.message;
        refundAlertEl.style.display = "block";
        if (res.field === "refundRef") {
          refundTxnInput.classList.add("is-invalid-field");
          refundTxnInput.focus();
        }
        return;
      }
      closeRefundModal();
      window.SuotUI.toast(
        `Verified refund of ${window.SuotStore.formatPrice(res.request.amount)} (${res.request.refundRef}) & updated analytics/e-receipt!`,
        "Refund Paid"
      );
      syncRolePermissions();
      renderReturnsTab();
      flashAdminRow(retId);
    });
  }

  function attemptOrderStatusChange(ordNum, newStatus, courier, trk, onDone) {
    const ord = window.SuotStore.getOrders().find((o) => o.orderNumber === ordNum);
    if (!ord) return;

    if (newStatus === "Cancelled") {
      if (ord.status === "Delivered") {
        window.SuotUI.toast(
          `Order #${ordNum} was already Delivered. Use Returns & Refunds instead of cancelling.`,
          "Cancellation Blocked"
        );
        if (typeof onDone === "function") onDone(false);
        return;
      }
      if (ord.status === "Cancelled" || ord.status === "Returned") {
        window.SuotUI.toast(`Order #${ordNum} is already marked "${ord.status}".`, "No Change Needed");
        if (typeof onDone === "function") onDone(false);
        return;
      }

      const unitCount = (ord.items || []).reduce((sum, i) => sum + Number(i.qty || 1), 0);
      const wasPaid = ord.paymentStatus === "Paid";
      openConfirmDialog({
        badge: "ORDER CANCELLATION",
        badgeClass: "pill-coral",
        title: `Cancel Order #${ordNum}?`,
        confirmLabel: "Confirm Cancel & Restock",
        confirmBtnClass: "btn-coral",
        bodyHtml: `
          <div class="admin-confirm-summary">
            <div><strong>${ord.customerName}</strong> · ${window.SuotStore.formatPrice(ord.total)}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">
              • <strong>+${unitCount} unit${unitCount === 1 ? "" : "s"}</strong> will return to catalog inventory<br />
              • Payment becomes <strong>${wasPaid ? "Refund Pending (queued for TXN verification)" : "Cancelled"}</strong><br />
              • Live Analytics &amp; Island Series revenue will exclude this order
            </div>
          </div>
        `,
        onConfirm: () => {
          const res = window.SuotStore.updateOrderStatus(ordNum, "Cancelled", courier, trk);
          if (!res || !res.ok) {
            window.SuotUI.toast((res && res.message) || "Unable to cancel order.", "Blocked");
            if (typeof onDone === "function") onDone(false);
            return;
          }
          window.SuotUI.toast(
            `Order #${ordNum} cancelled (${res.restockedUnits} units restocked) & revenue updated.`,
            "Order Cancelled"
          );
          if (typeof onDone === "function") onDone(true);
        }
      });
      return;
    }

    const res = window.SuotStore.updateOrderStatus(ordNum, newStatus, courier, trk);
    if (!res || !res.ok) {
      window.SuotUI.toast((res && res.message) || "Cannot update closed order status.", "Action Blocked");
      if (typeof onDone === "function") onDone(false);
      return;
    }
    window.SuotUI.toast(`Order #${ordNum} updated to "${newStatus}" & email sent to customer!`, "Status & Email Sent");
    if (typeof onDone === "function") onDone(true);
  }

  function flashAdminRow(rowKey) {
    if (!rowKey) return;
    requestAnimationFrame(() => {
      const row = workspaceEl.querySelector(`[data-row-key="${CSS.escape(rowKey)}"]`);
      if (row) {
        row.classList.remove("admin-row-flash");
        void row.offsetWidth;
        row.classList.add("admin-row-flash");
      }
    });
  }

  function syncRolePermissions() {
    roleDescEl.textContent = `${roleDescriptions[activeRole] || ""} Signed in: ${currUser.name}.`;
    const roleBadgeEl = document.getElementById("topbar-role-badge");
    if (roleBadgeEl) roleBadgeEl.textContent = `ROLE: ${activeRole.toUpperCase()}`;

    const adminEmailCountEl = document.getElementById("admin-email-count");
    if (adminEmailCountEl) adminEmailCountEl.textContent = window.SuotStore.getEmails().length;

    document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
      const allowed = (btn.getAttribute("data-roles") || "").split(",");
      const isAllowed = allowed.includes(activeRole);
      btn.disabled = !isAllowed;
      if (!isAllowed && btn.getAttribute("data-admin-tab") === activeTab) {
        activeTab = activeRole === "courier" ? "courier" : "analytics";
      }
    });

    document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-admin-tab") === activeTab);
    });

    const prods = window.SuotStore.getProducts(true);
    const orders = window.SuotStore.getOrders();
    const returns = window.SuotStore.getReturns();
    const awaitingPack = orders.filter((o) => o.status === "Pending" || o.status === "Confirmed").length;
    const actionReturns = returns.filter((r) => r.status.includes("Pending") || r.status.includes("Awaiting Refund")).length;

    document.getElementById("nav-prod-count").textContent = prods.length;
    document.getElementById("nav-order-count").textContent = awaitingPack
      ? `${awaitingPack} due`
      : String(orders.length);
    document.getElementById("nav-return-count").textContent = actionReturns;
    if (window.SuotUI && typeof window.SuotUI.enhanceSelects === "function") {
      window.SuotUI.enhanceSelects(roleSelectEl);
    }
  }

  function navigateAdminTab(nextTab, opts = {}) {
    if (opts.invFilter !== undefined) invFilter = opts.invFilter;
    if (opts.invSearch !== undefined) invSearch = opts.invSearch;
    if (opts.orderFilter !== undefined) orderFilter = opts.orderFilter;
    if (opts.orderSearch !== undefined) orderSearch = opts.orderSearch;

    activeTab = nextTab;
    if (window.SuotMotion && typeof window.SuotMotion.pulseTide === "function") {
      window.SuotMotion.pulseTide();
    }
    syncRolePermissions();
    renderActiveTab(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function finalizeWorkspaceStage(animate = false) {
    if (animate) {
      workspaceEl.classList.remove("admin-workspace-stage");
      void workspaceEl.offsetWidth;
      workspaceEl.classList.add("admin-workspace-stage");
    }
    if (window.SuotUI && typeof window.SuotUI.enhanceSelects === "function") {
      window.SuotUI.enhanceSelects(workspaceEl);
    }
    if (window.SuotMotion && typeof window.SuotMotion.initDocks === "function") {
      window.SuotMotion.initDocks(workspaceEl);
    }
  }

  // -------------------- TAB 1: REPORTING & STORE ANALYTICS --------------------
  function renderAnalyticsTab(animate = false) {
    const products = window.SuotStore.getProducts(true);
    const orders = window.SuotStore.getOrders();
    const returns = window.SuotStore.getReturns();

    // Pure live order analytics — exclude cancelled, returned, and refunded/refund-pending orders
    const activeOrders = orders.filter(
      (o) =>
        o.status !== "Cancelled" &&
        o.status !== "Returned" &&
        o.paymentStatus !== "Refunded" &&
        o.paymentStatus !== "Refund Pending"
    );
    const excludedOrders = orders.filter((o) => !activeOrders.includes(o));
    const excludedTotal = excludedOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    const liveRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const collectedRevenue = activeOrders
      .filter((o) => o.paymentStatus === "Paid" || o.status === "Delivered")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const codPendingRevenue = Math.max(0, liveRevenue - collectedRevenue);

    const pendingPackOrders = orders.filter((o) => o.status === "Pending" || o.status === "Confirmed");
    const inTransitOrders = orders.filter((o) => o.status === "Packed" || o.status === "Out for Delivery");
    const lowStockItems = products.filter((p) => !p.archived && p.stock <= 5).sort((a, b) => a.stock - b.stock);
    const actionReturns = returns.filter((r) => r.status.includes("Pending") || r.status.includes("Awaiting Refund"));

    const seriesStats = {
      Siargao: { amt: 0, units: 0, orders: new Set() },
      Boracay: { amt: 0, units: 0, orders: new Set() },
      "El Nido": { amt: 0, units: 0, orders: new Set() },
      "La Union": { amt: 0, units: 0, orders: new Set() }
    };
    const productLiveStats = {};

    activeOrders.forEach((o) => {
      const sub = Number(o.subtotal || 0);
      const disc = Number(o.discount || 0);
      const netFactor = sub > 0 && disc > 0 ? Math.max(0, sub - disc) / sub : 1;
      (o.items || []).forEach((it) => {
        const prod = window.SuotStore.getProductById(it.productId);
        const s = it.series || (prod && prod.series);
        const qty = Number(it.qty || 1);
        const lineNet = Math.round(Number(it.price || 0) * qty * netFactor);
        if (s && seriesStats[s]) {
          seriesStats[s].amt += lineNet;
          seriesStats[s].units += qty;
          seriesStats[s].orders.add(o.orderNumber);
        }
        if (it.productId) {
          if (!productLiveStats[it.productId]) productLiveStats[it.productId] = { units: 0, rev: 0 };
          productLiveStats[it.productId].units += qty;
          productLiveStats[it.productId].rev += lineNet;
        }
      });
    });

    const maxSeriesAmt = Math.max(...Object.values(seriesStats).map((x) => x.amt), 1);
    const totalUrgentActions = pendingPackOrders.length + lowStockItems.length + actionReturns.length;

    const topProducts = [...products]
      .filter((p) => !p.archived)
      .map((p) => ({
        product: p,
        liveUnits: (productLiveStats[p.id] && productLiveStats[p.id].units) || 0,
        liveRev: (productLiveStats[p.id] && productLiveStats[p.id].rev) || 0
      }))
      .sort((a, b) => b.liveRev - a.liveRev || b.liveUnits - a.liveUnits || (b.product.soldCount || 0) - (a.product.soldCount || 0))
      .slice(0, 5);

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Store Analytics &amp; Operations Command</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Computed directly from active non-cancelled, non-refunded orders across all 4 Island Series.
          </p>
        </div>
        <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-pill btn-sm" id="analytics-open-emails">Email Outbox</button>
          <button type="button" class="btn btn-primary btn-pill btn-sm" id="analytics-go-inventory">+ Add Product</button>
        </div>
      </div>

      <!-- High-Signal Action Required Strip -->
      <div class="ops-attention-strip" role="region" aria-label="Urgent Operational Actions">
        <div class="ops-attention-head">
          <span class="ops-pulse-dot ${totalUrgentActions ? "" : "is-clear"}" aria-hidden="true"></span>
          <div>
            <div class="ops-attention-title">
              ${totalUrgentActions ? `${totalUrgentActions} Operational Items Need Attention` : "All Manila Hub Queues Clear"}
            </div>
            <div class="ops-attention-sub">
              ${totalUrgentActions
                ? "Click any priority pill to jump directly into the filtered action queue."
                : "No overdue packing, pending refunds, or critical SKU shortages right now."}
            </div>
          </div>
        </div>

        <div class="ops-attention-pills">
          <button type="button" class="ops-action-chip ${pendingPackOrders.length ? "is-urgent" : ""}" id="attn-orders-btn">
            <span>Awaiting Pack &amp; Dispatch</span>
            <span class="ops-action-count">${pendingPackOrders.length}</span>
          </button>
          <button type="button" class="ops-action-chip ${lowStockItems.length ? "is-urgent" : ""}" id="attn-stock-btn">
            <span>Critical Stock (&le;5)</span>
            <span class="ops-action-count">${lowStockItems.length}</span>
          </button>
          <button type="button" class="ops-action-chip ${actionReturns.length ? "is-urgent" : ""}" id="attn-returns-btn">
            <span>Returns &amp; Refunds Due</span>
            <span class="ops-action-count">${actionReturns.length}</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Row -->
      <div class="ops-summary-grid">
        <button type="button" class="ops-tile is-interactive is-active-lagoon" id="kpi-rev-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Live Net Order Revenue</span>
            <span class="pill pill-delivery">${activeOrders.length} Active</span>
          </div>
          <div class="ops-tile-value" id="analytics-live-rev">${window.SuotStore.formatPrice(liveRevenue)}</div>
          <div class="ops-tile-foot">
            Paid: ${window.SuotStore.formatPrice(collectedRevenue)} · COD: ${window.SuotStore.formatPrice(codPendingRevenue)}
            ${excludedOrders.length ? `<br />Excl. ${excludedOrders.length} cancelled/refunded (${window.SuotStore.formatPrice(excludedTotal)})` : ""}
          </div>
        </button>

        <button type="button" class="ops-tile is-interactive ${pendingPackOrders.length ? "is-urgent-coral" : "is-active-lagoon"}" id="kpi-pack-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Orders Awaiting Pack</span>
            <span class="pill ${pendingPackOrders.length ? "pill-coral" : "pill-delivery"}">${pendingPackOrders.length ? "Needs Pack" : "Clear"}</span>
          </div>
          <div class="ops-tile-value" style="${pendingPackOrders.length ? "color:var(--color-coral-deep);" : ""}">${pendingPackOrders.length}</div>
          <div class="ops-tile-foot">${inTransitOrders.length} in transit · Click to process queue →</div>
        </button>

        <button type="button" class="ops-tile is-interactive ${lowStockItems.length ? "is-urgent-coral" : ""}" id="kpi-stock-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Low-Stock Alerts (&le; 5 units)</span>
            <span class="pill ${lowStockItems.length ? "pill-coral" : "pill-delivery"}">${lowStockItems.length ? "Urgent" : "Healthy"}</span>
          </div>
          <div class="ops-tile-value" style="${lowStockItems.length ? "color:var(--color-coral-deep);" : ""}">${lowStockItems.length} SKUs</div>
          <div class="ops-tile-foot">Click to open Low-Stock filter in Catalog →</div>
        </button>

        <button type="button" class="ops-tile is-interactive ${actionReturns.length ? "is-urgent-coral" : ""}" id="kpi-ret-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Returns &amp; Payouts Queue</span>
            <span class="pill ${actionReturns.length ? "pill-coral" : "pill-sand"}">${actionReturns.length ? "Review" : "Clear"}</span>
          </div>
          <div class="ops-tile-value">${actionReturns.length}</div>
          <div class="ops-tile-foot">Stage 1 review &amp; Stage 2 payout confirmation →</div>
        </button>
      </div>

      <div class="split-checkout-grid" style="padding-block:0;">
        <!-- Island Series Breakdown + Top Sellers computed strictly from live orders -->
        <section class="surface-card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:var(--space-4);">
            <h2 style="margin:0;font-size:var(--text-lg);">Revenue by Philippine Island Series</h2>
            <span class="mono" style="font-size:0.72rem;color:var(--text-muted);">Live item sales · Excl. cancelled/refunded</span>
          </div>

          <div class="series-bar-list" style="margin-bottom:var(--space-6);">
            ${Object.entries(seriesStats)
              .map(([series, stat]) => {
                const pct = stat.amt > 0 ? Math.max(4, Math.min(100, Math.round((stat.amt / maxSeriesAmt) * 100))) : 0;
                return `
                  <div class="series-bar-item" data-series-stat="${series}">
                    <div class="series-bar-top">
                      <button type="button" class="card-size-pill" data-jump-series="${series}" style="font-weight:700;">
                        ${series} · ${stat.orders.size} ord · ${stat.units} units →
                      </button>
                      <span class="price" data-series-rev="${series}">${window.SuotStore.formatPrice(stat.amt)}</span>
                    </div>
                    <div class="series-bar-track">
                      <div class="series-bar-fill" style="width:${pct}%;"></div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>

          <h3 style="font-size:var(--text-base);margin-bottom:var(--space-3);">Top 5 Pieces by Live Order Revenue</h3>
          <div class="data-table-wrap" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Series</th>
                  <th>Price</th>
                  <th>Active Orders</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts
                  .map(
                    ({ product: p, liveUnits, liveRev }) => `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:0.65rem;">
                          <div class="admin-thumb-sm">${getProductThumb(p)}</div>
                          <div style="min-width:0;">
                            <strong style="display:block;font-size:0.84rem;">${p.name}</strong>
                            <span class="mono" style="font-size:0.7rem;color:var(--text-muted);">${p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td><span class="pill pill-lagoon">${p.series}</span></td>
                      <td class="price">${window.SuotStore.formatPrice(p.price)}</td>
                      <td class="tabular">
                        <strong>${liveUnits} unit${liveUnits === 1 ? "" : "s"}</strong>
                        <div style="font-size:0.72rem;color:var(--text-muted);">${window.SuotStore.formatPrice(liveRev)}</div>
                      </td>
                    </tr>
                  `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </section>

        <!-- Highlighted Low-Stock Alert Queue with Product Thumbnails -->
        <aside class="surface-card" style="${lowStockItems.length ? "border-color:rgba(242,125,99,0.52);" : ""}">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-3);">
            <h2 style="margin:0;font-size:var(--text-lg);">Low-Stock Priority Queue</h2>
            <span class="pill ${lowStockItems.length ? "pill-coral" : "pill-delivery"}">
              ${lowStockItems.length} ${lowStockItems.length === 1 ? "Critical SKU" : "Critical SKUs"}
            </span>
          </div>
          <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:var(--space-4);">
            Items with &le; 5 units trigger urgent coral badges on the storefront. Click <strong>+10 Restock</strong> to replenish Manila Hub immediately.
          </p>

          <div style="display:flex;flex-direction:column;gap:var(--space-3);">
            ${
              lowStockItems.length
                ? lowStockItems
                    .map(
                      (item) => `
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-3);padding:0.65rem 0.8rem;background:var(--color-coral-surface);border:1px solid rgba(242,125,99,0.35);border-radius:var(--radius-md);">
                        <div style="display:flex;align-items:center;gap:0.65rem;min-width:0;">
                          <div class="admin-thumb-sm">${getProductThumb(item)}</div>
                          <div style="min-width:0;">
                            <strong style="font-size:0.84rem;color:var(--text-primary);display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.name}</strong>
                            <div class="mono" style="font-size:0.72rem;color:var(--color-coral-deep);font-weight:700;">${item.sku} · Only ${item.stock} left</div>
                          </div>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm btn-pill" data-quick-restock="${item.id}" style="flex-shrink:0;">
                          +10 Restock
                        </button>
                      </div>
                    `
                    )
                    .join("")
                : `<div style="padding:var(--space-4);border-radius:var(--radius-md);background:rgba(168,213,186,0.18);font-size:var(--text-sm);color:var(--color-palm);font-weight:600;">✓ All active SKUs are stocked above the critical threshold.</div>`
            }
          </div>
        </aside>
      </div>
    `;

    document.getElementById("analytics-open-emails").addEventListener("click", () => window.SuotUI.openDrawer("email"));
    document.getElementById("analytics-go-inventory").addEventListener("click", () => {
      navigateAdminTab("inventory", { invFilter: "all" });
      openProductModal(null);
    });

    document.getElementById("attn-orders-btn").addEventListener("click", () => navigateAdminTab("orders", { orderFilter: "needs-action" }));
    document.getElementById("attn-stock-btn").addEventListener("click", () => navigateAdminTab("inventory", { invFilter: "low-stock" }));
    document.getElementById("attn-returns-btn").addEventListener("click", () => navigateAdminTab("returns"));

    document.getElementById("kpi-rev-btn").addEventListener("click", () => navigateAdminTab("orders", { orderFilter: "all" }));
    document.getElementById("kpi-pack-btn").addEventListener("click", () => navigateAdminTab("orders", { orderFilter: "needs-action" }));
    document.getElementById("kpi-stock-btn").addEventListener("click", () => navigateAdminTab("inventory", { invFilter: "low-stock" }));
    document.getElementById("kpi-ret-btn").addEventListener("click", () => navigateAdminTab("returns"));

    workspaceEl.querySelectorAll("[data-jump-series]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigateAdminTab("inventory", { invFilter: btn.getAttribute("data-jump-series"), invSearch: "" });
      });
    });

    workspaceEl.querySelectorAll("[data-quick-restock]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-quick-restock");
        const updated = window.SuotStore.adjustStock(pid, 10, false);
        window.SuotUI.toast(`Restocked ${updated.name} (+10 units → ${updated.stock} in stock).`, "Stock Replenished");
        syncRolePermissions();
        renderAnalyticsTab();
      });
    });

    finalizeWorkspaceStage(animate);
  }

  // -------------------- TAB 2: CATALOG & INVENTORY MANAGEMENT --------------------
  function renderInventoryTab(animate = false) {
    const allProducts = window.SuotStore.getProducts(true);
    const lowCount = allProducts.filter((p) => !p.archived && p.stock <= 5).length;

    const q = invSearch.trim().toLowerCase();
    const products = allProducts.filter((p) => {
      if (invFilter === "low-stock" && (p.archived || p.stock > 5)) return false;
      if (invFilter !== "all" && invFilter !== "low-stock" && p.series !== invFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.sku} ${p.series} ${p.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const dockOptions = [
      { key: "all", label: "All SKUs", count: allProducts.length },
      { key: "low-stock", label: "Critical Stock", count: lowCount },
      { key: "Siargao", label: "Siargao", count: allProducts.filter((p) => p.series === "Siargao").length },
      { key: "Boracay", label: "Boracay", count: allProducts.filter((p) => p.series === "Boracay").length },
      { key: "El Nido", label: "El Nido", count: allProducts.filter((p) => p.series === "El Nido").length },
      { key: "La Union", label: "La Union", count: allProducts.filter((p) => p.series === "La Union").length }
    ];

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Catalog &amp; Inventory Control</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Filter low-stock shortages, update island pricing, preview variant imagery, and manage product availability.
          </p>
        </div>
        <button type="button" class="btn btn-primary btn-pill" id="open-new-product-btn">
          + Add Product
        </button>
      </div>

      <div class="admin-toolbar-row">
        <div class="featured-filter-dock" id="admin-inv-dock" role="tablist" aria-label="Filter Inventory">
          ${dockOptions
            .map(
              (opt) => `
              <button
                type="button"
                class="featured-filter-btn ${invFilter === opt.key ? "active" : ""}"
                data-inv-filter="${opt.key}"
                role="tab"
                aria-selected="${invFilter === opt.key ? "true" : "false"}"
              >
                <span>${opt.label}</span>
                <span class="featured-filter-count">(${opt.count})</span>
              </button>
            `
            )
            .join("")}
        </div>

        <input
          type="search"
          id="admin-inv-search"
          class="admin-search-input"
          placeholder="Search SKU or product..."
          value="${invSearch.replace(/"/g, "&quot;")}"
          aria-label="Search inventory products"
        />
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>SKU &amp; Product Name</th>
              <th>Series &amp; Category</th>
              <th>Variants &amp; Color Preview</th>
              <th>Price</th>
              <th>Stock Control</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${
              products.length
                ? products
                    .map((p) => {
                      const isLow = !p.archived && p.stock <= 5;
                      const activeColor =
                        selectedAdminColor[p.id] && p.colors.includes(selectedAdminColor[p.id])
                          ? selectedAdminColor[p.id]
                          : p.colors[0];
                      return `
                        <tr data-row-key="${p.id}" class="${isLow ? "admin-row-urgent" : ""}" style="${p.archived ? "opacity:0.55;" : ""}">
                          <td data-label="Preview">
                            <div style="width:52px;height:64px;background:var(--color-sand);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);overflow:hidden;">
                              ${window.SuotStore.renderProductVisual(p, activeColor)}
                            </div>
                          </td>
                          <td data-label="SKU & Product">
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                              <span class="mono" style="color:var(--text-muted);font-size:0.75rem;">${p.sku}</span>
                              ${isLow ? `<span class="pill pill-coral">LOW STOCK</span>` : ""}
                              ${p.archived ? `<span class="pill pill-coral-soft">Archived</span>` : ""}
                            </div>
                            <strong>${p.name}</strong>
                          </td>
                          <td data-label="Series & Category">
                            <span class="pill pill-lagoon">${p.series}</span>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:3px;">${p.category}</div>
                          </td>
                          <td data-label="Variants & Color" style="font-size:var(--text-xs);">
                            <div><strong>Sizes:</strong> ${(p.sizes || []).join(", ")}</div>
                            <div class="admin-swatch-strip" aria-label="Preview color variants for ${p.name}">
                              ${(p.colors || [])
                                .map(
                                  (c) => `
                                  <button
                                    type="button"
                                    class="admin-swatch-btn ${c === activeColor ? "active" : ""}"
                                    data-admin-color-prod="${p.id}"
                                    data-admin-color-val="${c}"
                                    title="Preview ${c}"
                                  >
                                    <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(c)};"></span>
                                    <span>${c}</span>
                                  </button>
                                `
                                )
                                .join("")}
                            </div>
                          </td>
                          <td class="price" data-label="Price"><strong>${window.SuotStore.formatPrice(p.price)}</strong></td>
                          <td data-label="Stock Control">
                            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                              <button type="button" class="btn btn-outline btn-sm" data-stock-delta="-1" data-stock-id="${p.id}" style="padding:2px 8px;">−</button>
                              <span class="pill ${isLow ? "pill-coral" : "pill-delivery"} tabular">${p.stock}</span>
                              <button type="button" class="btn btn-outline btn-sm" data-stock-delta="1" data-stock-id="${p.id}" style="padding:2px 8px;">+</button>
                              ${
                                isLow
                                  ? `<button type="button" class="btn btn-primary btn-sm btn-pill" data-stock-delta="10" data-stock-id="${p.id}">+10</button>`
                                  : ""
                              }
                            </div>
                          </td>
                          <td data-label="Actions">
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-edit-prod="${p.id}">Edit</button>
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-archive-prod="${p.id}">
                                ${p.archived ? "Restore" : "Archive"}
                              </button>
                              ${
                                activeRole === "admin"
                                  ? `<button type="button" class="btn btn-ghost btn-sm" data-delete-prod="${p.id}" style="color:var(--color-coral-deep);">Delete</button>`
                                  : ""
                              }
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td colspan="7" style="text-align:center;padding:var(--space-8);color:var(--text-muted);">No products match this filter or search query.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("open-new-product-btn").addEventListener("click", () => openProductModal(null));

    workspaceEl.querySelectorAll("[data-inv-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        invFilter = btn.getAttribute("data-inv-filter");
        renderInventoryTab();
      });
    });

    const invSearchEl = document.getElementById("admin-inv-search");
    if (invSearchEl) {
      invSearchEl.addEventListener("input", () => {
        const pos = invSearchEl.selectionStart;
        invSearch = invSearchEl.value;
        renderInventoryTab();
        const nextInp = document.getElementById("admin-inv-search");
        if (nextInp) {
          nextInp.focus();
          if (pos != null) nextInp.setSelectionRange(pos, pos);
        }
      });
    }

    workspaceEl.querySelectorAll("[data-admin-color-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-admin-color-prod");
        const clr = btn.getAttribute("data-admin-color-val");
        selectedAdminColor[pid] = clr;
        renderInventoryTab();
      });
    });

    workspaceEl.querySelectorAll("[data-stock-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-stock-id");
        const delta = Number(btn.getAttribute("data-stock-delta"));
        const item = window.SuotStore.adjustStock(pid, delta, false);
        window.SuotUI.toast(`${item.name} stock updated to ${item.stock} units.`, "Inventory Updated");
        syncRolePermissions();
        renderInventoryTab();
        flashAdminRow(pid);
      });
    });

    workspaceEl.querySelectorAll("[data-edit-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const prod = window.SuotStore.getProductById(btn.getAttribute("data-edit-prod"));
        openProductModal(prod);
      });
    });

    workspaceEl.querySelectorAll("[data-archive-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-archive-prod");
        const prod = window.SuotStore.getProductById(pid);
        if (!prod) return;

        const isRestore = !!prod.archived;
        const unitLabel = Number(prod.stock) === 1 ? "unit" : "units";
        if (isRestore) {
          const stockColor = prod.stock <= 0 ? "var(--color-coral-deep)" : "var(--color-palm)";
          const stockNote =
            prod.stock <= 0
              ? "Stock is currently <strong>0 units</strong> — customers will see it as sold out until restocked."
              : prod.stock <= 5
              ? `Low stock alert: only <strong>${prod.stock} ${unitLabel}</strong> left for immediate purchase.`
              : `Re-enables storefront purchasing with <strong>${prod.stock} ${unitLabel}</strong> ready in inventory.`;

          openConfirmDialog({
            badge: "RESTORE · LIVE",
            badgeClass: "pill-palm",
            title: `Restore "${prod.name}"?`,
            confirmLabel: "Restore to Storefront",
            confirmBtnClass: "btn-primary",
            triggerEl: btn,
            bodyHtml: renderProductConfirmBody(prod, stockColor, [
              "Publishes item back onto Catalog, Search, and Series shelves.",
              stockNote
            ]),
            onConfirm: () => {
              const item = window.SuotStore.toggleArchiveProduct(pid);
              window.SuotUI.toast(`${item.name} restored to storefront.`, "Catalog Updated");
              syncRolePermissions();
              renderInventoryTab();
              flashAdminRow(pid);
            }
          });
          return;
        }

        const activeOrders = countActiveOrdersForProduct(pid);
        openConfirmDialog({
          badge: "REVERSIBLE HIDE",
          badgeClass: "pill-sand",
          title: `Archive "${prod.name}"?`,
          confirmLabel: "Archive Product",
          confirmBtnClass: "btn-primary",
          triggerEl: btn,
          bodyHtml: renderProductConfirmBody(prod, "var(--color-lagoon-ink)", [
            "Hides item from Catalog, Search, and active shopping bags.",
            `Keeps <strong>${prod.stock} ${unitLabel}</strong> in inventory and preserves sales records.`,
            activeOrders > 0
              ? `<strong>${activeOrders} open order${activeOrders === 1 ? "" : "s"}</strong> continue fulfilling normally — restore anytime.`
              : "Reversible anytime using <strong>Restore</strong> in Catalog &amp; Inventory."
          ]),
          onConfirm: () => {
            const item = window.SuotStore.toggleArchiveProduct(pid);
            window.SuotUI.toast(`${item.name} archived from storefront.`, "Catalog Updated");
            syncRolePermissions();
            renderInventoryTab();
            flashAdminRow(pid);
          }
        });
      });
    });

    workspaceEl.querySelectorAll("[data-delete-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-delete-prod");
        const prod = window.SuotStore.getProductById(pid);
        if (!prod) return;
        openConfirmDialog({
          badge: "DELETE PRODUCT",
          badgeClass: "pill-coral",
          title: `Delete "${prod.name}"?`,
          confirmLabel: "Permanently Delete",
          confirmBtnClass: "btn-coral",
          triggerEl: btn,
          bodyHtml: renderProductConfirmBody(
            prod,
            "var(--color-coral-deep)",
            [
              "Permanently removes this item from Catalog and Admin Inventory.",
              "Consider using <strong>Archive</strong> instead if this seasonal piece may return later."
            ],
            "is-danger"
          ),
          onConfirm: () => {
            window.SuotStore.deleteProduct(pid);
            window.SuotUI.toast(`Deleted ${prod.name} (${prod.sku}) from catalog.`, "Product Deleted");
            syncRolePermissions();
            renderInventoryTab();
          }
        });
      });
    });

    finalizeWorkspaceStage(animate);
  }

  function openProductModal(product) {
    uploadedImageDataUrl = product && product.customImageUrl ? product.customImageUrl : null;
    document.getElementById("crud-modal-title").textContent = product
      ? `Edit Product: ${product.name}`
      : "Create New Island Product";
    document.getElementById("crud-id").value = product ? product.id : "";
    document.getElementById("crud-name").value = product ? product.name : "";
    document.getElementById("crud-sku").value = product ? product.sku : "SI-ISL-" + Math.floor(100 + Math.random() * 899);
    document.getElementById("crud-series").value = product ? product.series : "Siargao";
    document.getElementById("crud-category").value = product ? product.category : "Swim & Surf";
    document.getElementById("crud-price").value = product ? product.price : 1590;
    document.getElementById("crud-stock").value = product ? product.stock : 15;
    document.getElementById("crud-sizes").value = product ? (product.sizes || []).join(", ") : "S, M, L, XL";
    document.getElementById("crud-colors").value = product ? (product.colors || []).join(", ") : "Lagoon Teal, Sunset Coral";
    document.getElementById("crud-desc").value = product ? product.description : "";
    imageFileInput.value = "";

    if (uploadedImageDataUrl) {
      imagePreviewImg.src = uploadedImageDataUrl;
      imagePreviewWrap.style.display = "flex";
    } else {
      imagePreviewWrap.style.display = "none";
    }

    crudModal.classList.add("open");
    if (window.SuotUI && typeof window.SuotUI.enhanceSelects === "function") {
      window.SuotUI.enhanceSelects(crudModal);
    }
  }

  imageFileInput.addEventListener("change", () => {
    const file = imageFileInput.files && imageFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      uploadedImageDataUrl = ev.target.result;
      imagePreviewImg.src = uploadedImageDataUrl;
      imagePreviewWrap.style.display = "flex";
    };
    reader.readAsDataURL(file);
  });

  crudForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const payload = {
      id: document.getElementById("crud-id").value || undefined,
      name: document.getElementById("crud-name").value.trim(),
      sku: document.getElementById("crud-sku").value.trim(),
      series: document.getElementById("crud-series").value,
      category: document.getElementById("crud-category").value,
      price: Number(document.getElementById("crud-price").value),
      stock: Number(document.getElementById("crud-stock").value),
      sizes: document
        .getElementById("crud-sizes")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      colors: document
        .getElementById("crud-colors")
        .value.split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      description: document.getElementById("crud-desc").value.trim(),
      customImageUrl: uploadedImageDataUrl || undefined,
      silhouette: "shirt"
    };

    window.SuotStore.saveProduct(payload);
    crudModal.classList.remove("open");
    syncRolePermissions();
    renderInventoryTab();
    window.SuotUI.toast(`Saved "${payload.name}" to the Suot Isla catalog!`, "Catalog Saved");
  });

  document.getElementById("close-crud-modal-btn").addEventListener("click", () => crudModal.classList.remove("open"));
  document.getElementById("cancel-crud-modal-btn").addEventListener("click", () => crudModal.classList.remove("open"));

  // -------------------- TAB 3: ORDER FULFILLMENT & STATUS --------------------
  function renderOrdersTab(animate = false) {
    const allOrders = window.SuotStore.getOrders();
    const counts = {
      all: allOrders.length,
      "needs-action": allOrders.filter((o) => o.status === "Pending" || o.status === "Confirmed").length,
      "in-transit": allOrders.filter((o) => o.status === "Packed" || o.status === "Out for Delivery").length,
      Delivered: allOrders.filter((o) => o.status === "Delivered").length,
      Cancelled: allOrders.filter((o) => o.status === "Cancelled" || o.status === "Returned").length
    };

    const q = orderSearch.trim().toLowerCase();
    const orders = allOrders.filter((o) => {
      if (orderFilter === "needs-action" && o.status !== "Pending" && o.status !== "Confirmed") return false;
      if (orderFilter === "in-transit" && o.status !== "Packed" && o.status !== "Out for Delivery") return false;
      if (orderFilter === "Delivered" && o.status !== "Delivered") return false;
      if (orderFilter === "Cancelled" && o.status !== "Cancelled" && o.status !== "Returned") return false;
      if (q) {
        const hay = `${o.orderNumber} ${o.customerName} ${o.customerEmail} ${o.shippingAddress} ${o.trackingNumber}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const orderDockOpts = [
      { key: "all", label: "All Orders", count: counts.all },
      { key: "needs-action", label: "Awaiting Pack", count: counts["needs-action"] },
      { key: "in-transit", label: "In Transit", count: counts["in-transit"] },
      { key: "Delivered", label: "Delivered", count: counts.Delivered },
      { key: "Cancelled", label: "Cancelled", count: counts.Cancelled }
    ];

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Order Fulfillment &amp; Status Pipeline</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Process awaiting dispatches, assign couriers, inspect E-Receipts, and notify customers automatically.
          </p>
        </div>
        <button type="button" class="btn btn-outline btn-pill btn-sm" id="orders-open-email-drawer">
          Open Email Outbox
        </button>
      </div>

      <div class="admin-toolbar-row">
        <div class="featured-filter-dock" id="admin-orders-dock" role="tablist" aria-label="Filter Orders">
          ${orderDockOpts
            .map(
              (opt) => `
              <button
                type="button"
                class="featured-filter-btn ${orderFilter === opt.key ? "active" : ""}"
                data-admin-ord-filter="${opt.key}"
                role="tab"
                aria-selected="${orderFilter === opt.key ? "true" : "false"}"
              >
                <span>${opt.label}</span>
                <span class="featured-filter-count">(${opt.count})</span>
              </button>
            `
            )
            .join("")}
        </div>

        <input
          type="search"
          id="admin-orders-search"
          class="admin-search-input"
          placeholder="Search order #, customer, city..."
          value="${orderSearch.replace(/"/g, "&quot;")}"
          aria-label="Search orders"
        />
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order # &amp; Date</th>
              <th>Customer &amp; Destination</th>
              <th>Items</th>
              <th>Total &amp; Payment</th>
              <th>Courier &amp; Tracking</th>
              <th>Status</th>
              <th>Update &amp; Receipt</th>
            </tr>
          </thead>
          <tbody>
            ${
              orders.length
                ? orders
                    .map((o) => {
                      const needsAction = o.status === "Pending" || o.status === "Confirmed";
                      const phoneDisplay = window.SuotStore.normalizePhMobile(o.customerPhone) || o.customerPhone;
                      return `
                        <tr data-row-key="${o.orderNumber}" class="${needsAction ? "admin-row-needs-action" : ""}">
                          <td data-label="Order # & Date">
                            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                              <strong class="mono">#${o.orderNumber}</strong>
                              ${needsAction ? `<span class="pill pill-lagoon">NEEDS PACK</span>` : ""}
                            </div>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">${o.placedAt}</div>
                          </td>
                          <td data-label="Customer & Destination">
                            <strong>${o.customerName}</strong>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);">${o.customerEmail} · ${phoneDisplay}</div>
                            <div style="font-size:var(--text-xs);max-width:260px;margin-top:2px;">${o.shippingAddress}</div>
                          </td>
                          <td data-label="Items" style="font-size:var(--text-xs);">
                            ${o.items
                              .map((i) => {
                                const prod = window.SuotStore.getProductById(i.productId);
                                return `
                                  <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                                    <div style="width:28px;height:35px;border-radius:4px;overflow:hidden;border:1px solid var(--border-subtle);background:var(--color-sand);flex-shrink:0;">
                                      ${prod ? window.SuotStore.renderProductVisual(prod, i.color) : ""}
                                    </div>
                                    <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(i.color)};"></span>
                                    <span>${i.qty}× <strong>${i.name}</strong> (${i.size})</span>
                                  </div>
                                `;
                              })
                              .join("")}
                          </td>
                          <td data-label="Total & Payment">
                            <strong class="price">${window.SuotStore.formatPrice(o.total)}</strong>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);">${o.paymentMethod} (${o.paymentStatus})</div>
                          </td>
                          <td data-label="Courier & Tracking" style="font-size:var(--text-xs);">
                            <div>${o.courierName}</div>
                            <span class="mono" style="color:var(--color-lagoon);">${o.trackingNumber}</span>
                          </td>
                          <td data-label="Status">
                            <span class="pill ${
                              o.status === "Cancelled" || o.status === "Returned"
                                ? "pill-coral"
                                : o.status === "Delivered"
                                ? "pill-palm"
                                : "pill-delivery"
                            }">${o.status}</span>
                          </td>
                          <td data-label="Update & Receipt">
                            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                              <select class="form-select" style="width:auto;padding:0.32rem 0.55rem;font-size:var(--text-xs);" data-status-select="${o.orderNumber}">
                                ${["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"]
                                  .map((st) => `<option value="${st}" ${o.status === st ? "selected" : ""}>${st}</option>`)
                                  .join("")}
                              </select>
                              <button type="button" class="btn btn-primary btn-sm btn-pill" data-status-save="${o.orderNumber}">
                                Save &amp; Email
                              </button>
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-admin-receipt="${o.orderNumber}">
                                Receipt
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")
                : `<tr><td colspan="7" style="text-align:center;padding:var(--space-8);color:var(--text-muted);">No orders match this status or search filter.</td></tr>`
            }
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("orders-open-email-drawer").addEventListener("click", () => window.SuotUI.openDrawer("email"));

    workspaceEl.querySelectorAll("[data-admin-ord-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        orderFilter = btn.getAttribute("data-admin-ord-filter");
        renderOrdersTab();
      });
    });

    const ordSearchEl = document.getElementById("admin-orders-search");
    if (ordSearchEl) {
      ordSearchEl.addEventListener("input", () => {
        const pos = ordSearchEl.selectionStart;
        orderSearch = ordSearchEl.value;
        renderOrdersTab();
        const nextInp = document.getElementById("admin-orders-search");
        if (nextInp) {
          nextInp.focus();
          if (pos != null) nextInp.setSelectionRange(pos, pos);
        }
      });
    }

    workspaceEl.querySelectorAll("[data-admin-receipt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.SuotUI.openReceiptModal(btn.getAttribute("data-admin-receipt"));
      });
    });

    workspaceEl.querySelectorAll("[data-status-save]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ordNum = btn.getAttribute("data-status-save");
        const selectEl = workspaceEl.querySelector(`[data-status-select="${ordNum}"]`);
        const newStatus = selectEl.value;
        const courier =
          newStatus === "Out for Delivery" || newStatus === "Delivered"
            ? "Kuya Jomar Santos (Island Express)"
            : undefined;
        const trk =
          newStatus === "Out for Delivery" || newStatus === "Delivered"
            ? "ISLA-TRK-" + Math.floor(10000 + Math.random() * 89999)
            : undefined;

        attemptOrderStatusChange(ordNum, newStatus, courier, trk, (updated) => {
          syncRolePermissions();
          renderOrdersTab();
          if (updated) flashAdminRow(ordNum);
        });
      });
    });

    finalizeWorkspaceStage(animate);
  }

  // -------------------- TAB 4: COURIER / DELIVERY PORTAL --------------------
  function renderCourierTab(animate = false) {
    const rank = { Pending: 0, Confirmed: 1, Packed: 2, "Out for Delivery": 3, Delivered: 4, Cancelled: 5 };
    const orders = [...window.SuotStore.getOrders()].sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Courier Dispatch Board</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Prioritized active dispatches across Philippine ports—confirm packing, transit handoff, and doorstep delivery.
          </p>
        </div>
        <span class="pill pill-delivery">Active Courier: Kuya Jomar Santos (Island Express)</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        ${orders
          .map((o) => {
            const isPriority = o.status === "Pending" || o.status === "Confirmed" || o.status === "Out for Delivery";
            const phoneDisplay = window.SuotStore.normalizePhMobile(o.customerPhone) || o.customerPhone;
            return `
              <article class="surface-card" data-row-key="${o.orderNumber}" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4);${isPriority ? "border-color:rgba(14,107,116,0.45);" : ""}">
                <div>
                  <div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap;margin-bottom:4px;">
                    <strong class="mono">#${o.orderNumber}</strong>
                    <span class="pill pill-lagoon">${o.trackingNumber}</span>
                    <span class="pill ${o.status === "Delivered" ? "pill-palm" : o.status === "Cancelled" ? "pill-coral" : "pill-delivery"}">${o.status}</span>
                  </div>
                  <div style="font-weight:700;">${o.customerName} · ${phoneDisplay}</div>
                  <div style="font-size:var(--text-sm);color:var(--text-secondary);">Drop-off: ${o.shippingAddress}</div>
                  <div style="display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-top:8px;">
                    ${o.items
                      .map((i) => {
                        const prod = window.SuotStore.getProductById(i.productId);
                        return `
                          <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px 4px 4px;border:1px solid var(--border-subtle);border-radius:var(--radius-sm);background:var(--bg-surface);font-size:var(--text-xs);">
                            <div style="width:28px;height:35px;border-radius:4px;overflow:hidden;flex-shrink:0;">
                              ${prod ? window.SuotStore.renderProductVisual(prod, i.color) : ""}
                            </div>
                            <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(i.color)};"></span>
                            <span><strong>${i.qty}× ${i.name}</strong> (${i.size}, ${i.color})</span>
                          </div>
                        `;
                      })
                      .join("")}
                  </div>
                </div>

                <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
                  <button type="button" class="btn btn-outline btn-sm btn-pill" data-courier-act="${o.orderNumber}" data-courier-status="Packed">
                    Mark Packed
                  </button>
                  <button type="button" class="btn btn-outline btn-sm btn-pill" data-courier-act="${o.orderNumber}" data-courier-status="Out for Delivery">
                    Out for Delivery
                  </button>
                  <button type="button" class="btn btn-primary btn-sm btn-pill" data-courier-act="${o.orderNumber}" data-courier-status="Delivered">
                    Confirm Delivered
                  </button>
                  <button type="button" class="btn btn-outline btn-sm btn-pill" data-courier-receipt="${o.orderNumber}">
                    Receipt
                  </button>
                </div>
              </article>
            `;
          })
          .join("")}
      </div>
    `;

    workspaceEl.querySelectorAll("[data-courier-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ordNum = btn.getAttribute("data-courier-act");
        const st = btn.getAttribute("data-courier-status");
        attemptOrderStatusChange(ordNum, st, "Kuya Jomar Santos (Island Express)", undefined, (updated) => {
          syncRolePermissions();
          renderCourierTab();
          if (updated) flashAdminRow(ordNum);
        });
      });
    });

    workspaceEl.querySelectorAll("[data-courier-receipt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.SuotUI.openReceiptModal(btn.getAttribute("data-courier-receipt"));
      });
    });

    finalizeWorkspaceStage(animate);
  }

  // -------------------- TAB 5: RETURNS & REFUNDS PROCESSING --------------------
  function renderReturnsTab(animate = false) {
    const rankWeight = (s) => (s.includes("Pending Review") ? 0 : s.includes("Awaiting Refund") ? 1 : 2);
    const returnsList = [...window.SuotStore.getReturns()].sort((a, b) => rankWeight(a.status) - rankWeight(b.status));

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Refund &amp; Return Processing (2-Stage Verification)</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Stage 1 approves item return &amp; restocks inventory; Stage 2 verifies the actual GCash or Cash payout transaction reference before marking Refunded.
          </p>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order # &amp; Customer</th>
              <th>Request Type &amp; Reason</th>
              <th>Item &amp; Refund Amount</th>
              <th>Stock &amp; Payout Verification</th>
              <th>Status</th>
              <th>2-Stage Decision</th>
            </tr>
          </thead>
          <tbody>
            ${returnsList
              .map((r) => {
                const isStage1 = r.status.includes("Pending Review");
                const isStage2 = r.status === "Approved · Awaiting Refund";
                const rowClass = isStage1 ? "admin-row-urgent" : isStage2 ? "admin-row-needs-action" : "";
                return `
                  <tr data-row-key="${r.returnId}" class="${rowClass}">
                    <td class="mono" data-label="Return ID">
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <strong>${r.returnId}</strong>
                        ${isStage1 ? `<span class="pill pill-coral">STAGE 1 · REVIEW</span>` : ""}
                        ${isStage2 ? `<span class="pill pill-lagoon">STAGE 2 · PAYOUT DUE</span>` : ""}
                      </div>
                      <div style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;">${r.requestedAt}</div>
                    </td>
                    <td data-label="Order # & Customer">
                      <strong class="mono">#${r.orderNumber}</strong>
                      <div style="font-size:var(--text-xs);">${r.customerName}</div>
                    </td>
                    <td data-label="Type & Reason">
                      <span class="pill pill-sand">${r.type}</span>
                      <div style="font-size:var(--text-xs);font-weight:700;margin-top:4px;">${r.reason}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted);">${r.notes || ""}</div>
                    </td>
                    <td data-label="Item & Refund">
                      <div style="font-size:var(--text-xs);">${r.itemSummary}</div>
                      <strong class="price">${window.SuotStore.formatPrice(r.amount)}</strong>
                    </td>
                    <td data-label="Stock & Payout" style="font-size:var(--text-xs);">
                      <div>Restocked: <strong>${r.restocked ? `Yes (+${r.qty || 1} unit)` : "Not Yet"}</strong></div>
                      <div>
                        Payout TXN:
                        <strong>${r.refunded ? `Verified (${r.refundRef})` : isStage2 ? "Awaiting TXN Ref" : "Not Started"}</strong>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span class="pill ${
                        r.status.includes("Refunded") || r.status.includes("Closed")
                          ? "pill-delivery"
                          : isStage2
                          ? "pill-sand"
                          : r.status.includes("Rejected")
                          ? "pill-coral"
                          : "pill-lagoon"
                      }">${r.status}</span>
                    </td>
                    <td data-label="2-Stage Decision">
                      ${
                        isStage1
                          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                              <button type="button" class="btn btn-primary btn-sm btn-pill" data-ret-decide="${r.returnId}" data-ret-val="Approved">
                                Approve &amp; Restock
                              </button>
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-ret-decide="${r.returnId}" data-ret-val="Rejected" style="color:var(--color-coral-deep);">
                                Reject
                              </button>
                            </div>`
                          : isStage2
                          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                              <button type="button" class="btn btn-coral btn-sm btn-pill" data-ret-verify-refund="${r.returnId}">
                                Verify Refund TXN →
                              </button>
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-ret-receipt="${r.orderNumber}">
                                E-Receipt
                              </button>
                            </div>`
                          : `<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
                              <span style="font-size:var(--text-xs);color:var(--text-muted);">
                                ${r.refundedAt ? `Settled ${r.refundedAt}` : "Completed"}
                              </span>
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-ret-receipt="${r.orderNumber}">
                                E-Receipt
                              </button>
                            </div>`
                      }
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    workspaceEl.querySelectorAll("[data-ret-decide]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const retId = btn.getAttribute("data-ret-decide");
        const decision = btn.getAttribute("data-ret-val");
        const req = window.SuotStore.getReturns().find((r) => r.returnId === retId);
        if (!req) return;

        if (decision === "Approved") {
          openConfirmDialog({
            badge: "STAGE 1 · APPROVE RETURN",
            badgeClass: "pill-lagoon",
            title: `Approve Request ${retId}?`,
            confirmLabel: "Approve & Restock Item",
            confirmBtnClass: "btn-primary",
            bodyHtml: `
              <div class="admin-confirm-summary">
                <strong>${req.itemSummary}</strong>
                <div style="font-size:0.78rem;color:var(--text-muted);margin-top:4px;">
                  Customer: <strong>${req.customerName}</strong> · Order #${req.orderNumber} (${window.SuotStore.formatPrice(req.amount)})
                </div>
              </div>
              <p style="font-size:0.82rem;color:var(--text-secondary);margin:var(--space-3) 0 0;">
                Approving returns <strong>+${req.qty || 1} unit</strong> to inventory and queues payment for <strong>Stage 2 Transaction Verification</strong> (money is not marked refunded until you enter the TXN reference).
              </p>
            `,
            onConfirm: () => {
              const res = window.SuotStore.processReturnRequest(retId, "Approved", true);
              if (res && res.ok) {
                window.SuotUI.toast(
                  `Approved ${retId}! Restocked & moved to Stage 2 (Awaiting Refund TXN).`,
                  "Return Approved"
                );
              }
              syncRolePermissions();
              renderReturnsTab();
              flashAdminRow(retId);
            }
          });
        } else {
          openConfirmDialog({
            badge: "REJECT RETURN",
            badgeClass: "pill-coral",
            title: `Reject Request ${retId}?`,
            confirmLabel: "Confirm Rejection",
            confirmBtnClass: "btn-coral",
            bodyHtml: `<p style="font-size:0.84rem;color:var(--text-secondary);margin:0;">This marks request <strong>${retId}</strong> (#${req.orderNumber}) as rejected and emails <strong>${req.customerName}</strong>. Inventory and payments remain untouched.</p>`,
            onConfirm: () => {
              window.SuotStore.processReturnRequest(retId, "Rejected", false);
              window.SuotUI.toast(`Request ${retId} marked as rejected.`, "Return Rejected");
              syncRolePermissions();
              renderReturnsTab();
              flashAdminRow(retId);
            }
          });
        }
      });
    });

    workspaceEl.querySelectorAll("[data-ret-verify-refund]").forEach((btn) => {
      btn.addEventListener("click", () => {
        openRefundModal(btn.getAttribute("data-ret-verify-refund"));
      });
    });

    workspaceEl.querySelectorAll("[data-ret-receipt]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.SuotUI.openReceiptModal(btn.getAttribute("data-ret-receipt"));
      });
    });

    finalizeWorkspaceStage(animate);
  }

  // -------------------- TAB 6: TEAM & CUSTOMER ACCESS (RBAC) --------------------
  function renderUsersTab(animate = false) {
    const users = window.SuotStore.getUsers();
    const orders = window.SuotStore.getOrders();

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Team &amp; Customer Access Control</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Inspect storefront customers and operations team roles, PH mobile contacts, and active permission levels.
          </p>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Account ID</th>
              <th>Member &amp; Email</th>
              <th>Mobile &amp; Joined</th>
              <th>Storefront Activity</th>
              <th>Current Role</th>
              <th>Assign Permission</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((u) => {
                const userOrders = orders.filter((o) => o.customerEmail === u.email);
                const phoneDisplay = window.SuotStore.normalizePhMobile(u.phone) || u.phone || "—";
                const initials = String(u.name || "SI")
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0].toUpperCase())
                  .join("");
                return `
                  <tr data-row-key="usr-${u.id}">
                    <td class="mono" data-label="Account ID">#USR-0${u.id}</td>
                    <td data-label="Member & Email">
                      <div style="display:flex;align-items:center;gap:0.6rem;">
                        <span class="auth-avatar-badge" style="width:32px;height:32px;font-size:0.74rem;" aria-hidden="true">${initials}</span>
                        <div>
                          <strong>${u.name}</strong>
                          <div style="font-size:var(--text-xs);color:var(--text-muted);">${u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Mobile & Joined" style="font-size:var(--text-xs);">
                      <div class="mono">${phoneDisplay}</div>
                      <div style="color:var(--text-muted);">Joined ${u.joinedAt || "2026"}</div>
                    </td>
                    <td data-label="Activity" style="font-size:var(--text-xs);">
                      ${userOrders.length ? `<strong>${userOrders.length} orders placed</strong>` : "Operations Personnel"}
                    </td>
                    <td data-label="Current Role">
                      <span class="pill ${u.role === "admin" ? "pill-coral" : u.role === "courier" ? "pill-delivery" : "pill-lagoon"}">
                        ${u.role.toUpperCase()}
                      </span>
                    </td>
                    <td data-label="Assign Permission">
                      <select class="form-select" style="width:auto;padding:0.32rem 0.65rem;font-size:var(--text-xs);" data-user-role-id="${u.id}">
                        <option value="customer" ${u.role === "customer" ? "selected" : ""}>Customer</option>
                        <option value="admin" ${u.role === "admin" ? "selected" : ""}>Admin (Full Access)</option>
                        <option value="staff" ${u.role === "staff" ? "selected" : ""}>Staff (Catalog &amp; Orders)</option>
                        <option value="courier" ${u.role === "courier" ? "selected" : ""}>Fulfillment / Courier Only</option>
                      </select>
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    workspaceEl.querySelectorAll("[data-user-role-id]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const uid = sel.getAttribute("data-user-role-id");
        window.SuotStore.updateUserRole(uid, sel.value);
        window.SuotUI.toast(`Updated account #USR-0${uid} permission role to ${sel.value.toUpperCase()}.`, "RBAC Updated");
        renderUsersTab();
        flashAdminRow(`usr-${uid}`);
      });
    });

    finalizeWorkspaceStage(animate);
  }

  function renderActiveTab(animate = false) {
    if (activeTab === "analytics") renderAnalyticsTab(animate);
    else if (activeTab === "inventory") renderInventoryTab(animate);
    else if (activeTab === "orders") renderOrdersTab(animate);
    else if (activeTab === "courier") renderCourierTab(animate);
    else if (activeTab === "returns") renderReturnsTab(animate);
    else if (activeTab === "users") renderUsersTab(animate);
  }

  roleSelectEl.addEventListener("change", () => {
    const requested = roleSelectEl.value;
    if (signedInRole === "courier" && requested !== "courier") {
      roleSelectEl.value = "courier";
      return;
    }
    if (signedInRole === "staff" && requested === "admin") {
      roleSelectEl.value = activeRole;
      window.SuotUI.toast("Staff accounts cannot elevate to full Admin access.", "Role Restricted");
      return;
    }
    activeRole = requested;
    navigateAdminTab(activeRole === "courier" ? "courier" : activeTab);
    window.SuotUI.toast(`Viewing ${activeRole.toUpperCase()} workspace permissions.`, "RBAC Preview");
  });

  document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      navigateAdminTab(btn.getAttribute("data-admin-tab"));
    });
  });

  const adminEmailsBtn = document.getElementById("admin-open-emails-btn");
  if (adminEmailsBtn) {
    adminEmailsBtn.addEventListener("click", () => window.SuotUI.openDrawer("email"));
  }

  window.addEventListener("suotisla:statechange", () => {
    syncRolePermissions();
  });

  window.addEventListener("suotisla:adminfocusorder", (e) => {
    const ordNum = e && e.detail && e.detail.orderNumber;
    if (!ordNum) return;
    orderFilter = "all";
    orderSearch = "";
    activeTab = activeRole === "courier" ? "courier" : "orders";
    syncRolePermissions();
    renderActiveTab(true);
    const row = workspaceEl.querySelector(`[data-row-key="${CSS.escape(ordNum)}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      flashAdminRow(ordNum);
    }
    window.SuotUI.toast(`Focused Order #${ordNum} in ${activeTab === "courier" ? "Courier Dispatch" : "Order Fulfillment"}.`, "Order Focused");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (confirmModal && confirmModal.classList.contains("open")) closeConfirmDialog();
    if (refundModal && refundModal.classList.contains("open")) closeRefundModal();
    if (crudModal && crudModal.classList.contains("open")) crudModal.classList.remove("open");
  });

  syncRolePermissions();
  renderActiveTab(true);
});
