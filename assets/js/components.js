/* ==========================================================================
   Suot Isla — Shared UI Shell, Header, Slide-Over Cart & Email Outbox Drawer
   ========================================================================== */

(function () {
  const STAMP_SVG = `
    <svg class="brand-stamp" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="80" cy="80" r="74" fill="#F4EAD5" stroke="#FAF6EE" stroke-width="3"/>
      <circle cx="80" cy="80" r="65" stroke="#0E6B74" stroke-width="2" stroke-dasharray="6 4" stroke-linecap="round"/>
      <circle cx="80" cy="80" r="50" fill="#FAF6EE" stroke="#0E6B74" stroke-width="2"/>
      <path d="M54 84 A26 26 0 0 1 106 84" fill="#F27D63" fill-opacity="0.28" stroke="#F27D63" stroke-width="3" stroke-linecap="round"/>
      <path d="M34 88 C48 80, 64 80, 76 88 C86 94, 102 92, 112 82 C106 73, 93 73, 88 80" stroke="#0E6B74" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M38 99 C54 91, 70 93, 86 100 C98 105, 112 102, 122 94" stroke="#2E5A44" stroke-width="2.8" stroke-linecap="round"/>
    </svg>
  `;

  function getActivePage() {
    const path = window.location.pathname;
    const file = path.split("/").pop() || "index.html";
    return file.toLowerCase();
  }

  function renderHeader() {
    const mount = document.getElementById("site-header-mount");
    if (!mount) return;

    const activePage = getActivePage();
    const totals = window.SuotStore.getCartTotals();
    const emails = window.SuotStore.getEmails();
    const user = window.SuotStore.getCurrentUser();

    mount.innerHTML = `
      <div class="dispatch-bar">
        <div class="container dispatch-bar-inner">
          <div class="dispatch-Condition">
            <span class="pill pill-delivery">PHL Island Dispatch</span>
            <span>Free Philippine island delivery on orders ₱3,500+ • Code <strong class="mono">ISLA10</strong> for 10% off</span>
          </div>
          <div style="display:flex;align-items:center;gap:1rem;color:var(--color-seafoam);font-weight:600;">
            <span>Nationwide Philippine Delivery • 14-Day Easy Returns</span>
          </div>
        </div>
      </div>

      <header class="site-header">
        <div class="container header-inner">
          <a href="index.html" class="brand-link" aria-label="Suot Isla Home">
            ${STAMP_SVG}
            <div class="brand-wordmark">
              <span class="brand-title">SUOT ISLA</span>
              <span class="brand-subtitle">ISLAND-BORN SURF &amp; BEACHWEAR</span>
            </div>
          </a>

          <nav class="primary-nav" aria-label="Primary Navigation">
            <a href="index.html" class="nav-link ${activePage === "index.html" ? "active" : ""}">Home</a>
            <a href="catalog.html" class="nav-link ${activePage === "catalog.html" ? "active" : ""}">Catalog</a>
            <a href="catalog.html?series=Siargao" class="nav-link">Siargao</a>
            <a href="catalog.html?series=Boracay" class="nav-link">Boracay</a>
            <a href="catalog.html?series=El+Nido" class="nav-link">El Nido</a>
            <a href="catalog.html?series=La+Union" class="nav-link">La Union</a>
            <a href="account.html" class="nav-link ${activePage === "account.html" ? "active" : ""}">Orders</a>
          </nav>

          <div class="header-actions">
            <button type="button" class="icon-btn" id="open-email-drawer-btn" title="View Customer Order Emails">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="m3 7 9 6 9-6"/>
              </svg>
              <span>Emails</span>
              <span class="badge-count" id="header-email-count">${emails.length}</span>
            </button>

            <a href="${user ? "account.html" : "auth.html"}" class="icon-btn" title="Account &amp; Role Session">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c1.8-3.6 5-5.5 8-5.5s6.2 1.9 8 5.5"/>
              </svg>
              <span>${user.name.split(" ")[0]}</span>
            </a>

            <button type="button" class="icon-btn" id="open-cart-drawer-btn" title="Open Island Shopping Bag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Bag</span>
              <span class="badge-count" id="header-cart-count">${totals.itemCount}</span>
            </button>
          </div>
        </div>
      </header>
    `;

    const cartBtn = document.getElementById("open-cart-drawer-btn");
    if (cartBtn) cartBtn.addEventListener("click", () => SuotUI.openDrawer("cart"));

    const emailBtn = document.getElementById("open-email-drawer-btn");
    if (emailBtn) emailBtn.addEventListener("click", () => SuotUI.openDrawer("email"));
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer-mount");
    if (!mount) return;

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <div style="display:flex;align-items:center;gap:0.75rem;">
                ${STAMP_SVG}
                <div>
                  <strong style="font-family:var(--font-display);font-size:1.25rem;color:var(--color-sand-light);">SUOT ISLA</strong>
                  <div style="font-size:0.75rem;color:var(--color-seafoam);">"Suot" (Wear) + "Isla" (Island)</div>
                </div>
              </div>
              <p>
                Breathable, durable, and sun-ready apparel inspired by Philippine surf towns—built for weekend beachgoers, surfers, and island travelers.
              </p>
            </div>

            <div class="footer-col">
              <h4>4 Island Collections</h4>
              <ul class="footer-links">
                <li><a href="catalog.html?series=Siargao">Siargao Series (Wave Gear)</a></li>
                <li><a href="catalog.html?series=Boracay">Boracay Series (Resort Linen)</a></li>
                <li><a href="catalog.html?series=El+Nido">El Nido Series (Lagoon Swim)</a></li>
                <li><a href="catalog.html?series=La+Union">La Union Series (Coastal Street)</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>Customer Flow</h4>
              <ul class="footer-links">
                <li><a href="catalog.html">All 16 Products &amp; Filters</a></li>
                <li><a href="cart.html">Shopping Bag &amp; Coupons</a></li>
                <li><a href="checkout.html">Checkout &amp; Payment</a></li>
                <li><a href="account.html">Order History &amp; Returns</a></li>
                <li><a href="auth.html">Login / Register</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <h4>Customer Care</h4>
              <ul class="footer-links">
                <li><a href="account.html">Track Your Order</a></li>
                <li><a href="account.html">Returns &amp; Exchanges</a></li>
                <li><a href="cart.html">Island Shipping Rates</a></li>
                <li><a href="mailto:ola@suotisla.ph">Contact: ola@suotisla.ph</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <span>© 2026 Suot Isla — Island-Born Surf &amp; Beachwear. All rights reserved.</span>
            <div class="footer-bottom-meta">
              <span>Handcrafted for Philippine Surf Towns</span>
              <span aria-hidden="true">·</span>
              <a href="admin.html" class="footer-portal-link">Admin &amp; Operations Portal →</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function ensureDrawersMounted() {
    if (document.getElementById("suot-drawers-root")) return;
    const root = document.createElement("div");
    root.id = "suot-drawers-root";
    root.innerHTML = `
      <div class="drawer-backdrop" id="suot-drawer-backdrop"></div>

      <!-- Slide-Over Shopping Bag Drawer -->
      <aside class="slide-drawer" id="suot-cart-drawer" aria-label="Shopping Bag Drawer">
        <div class="drawer-header">
          <h3>Your Island Bag</h3>
          <button type="button" class="drawer-close" data-close-drawer aria-label="Close Bag">✕</button>
        </div>
        <div class="drawer-body" id="suot-cart-drawer-body"></div>
        <div class="drawer-footer" id="suot-cart-drawer-footer"></div>
      </aside>

      <!-- Slide-Over Email Notification Outbox Drawer -->
      <aside class="slide-drawer" id="suot-email-drawer" aria-label="Email Notifications Drawer">
        <div class="drawer-header">
          <h3>Customer Email Notifications</h3>
          <button type="button" class="drawer-close" data-close-drawer aria-label="Close Email Outbox">✕</button>
        </div>
        <div class="drawer-body" id="suot-email-drawer-body"></div>
        <div class="drawer-footer">
          <p style="font-size:var(--text-xs);color:var(--text-secondary);">
            Live transactional email log for Order Confirmation, Shipping Updates, and Cancellations.
          </p>
        </div>
      </aside>

      <!-- Toast Notifications -->
      <div class="toast-container" id="suot-toast-container" aria-live="polite"></div>
    `;
    document.body.appendChild(root);

    document.getElementById("suot-drawer-backdrop").addEventListener("click", () => SuotUI.closeDrawers());
    root.querySelectorAll("[data-close-drawer]").forEach((btn) => {
      btn.addEventListener("click", () => SuotUI.closeDrawers());
    });
  }

  function renderCartDrawerContents() {
    const bodyEl = document.getElementById("suot-cart-drawer-body");
    const footEl = document.getElementById("suot-cart-drawer-footer");
    if (!bodyEl || !footEl) return;

    const cart = window.SuotStore.getCart();
    const totals = window.SuotStore.getCartTotals();

    if (!cart.length) {
      bodyEl.innerHTML = `
        <div style="text-align:center;padding:var(--space-10) var(--space-4);">
          <h4>Your Island Bag is Empty</h4>
          <p style="font-size:var(--text-sm);margin:var(--space-2) auto var(--space-6);">
            Explore our 16 coastal pieces across Siargao, Boracay, El Nido, and La Union.
          </p>
          <a href="catalog.html" class="btn btn-primary">Browse All 16 Products</a>
        </div>
      `;
      footEl.innerHTML = "";
      return;
    }

    bodyEl.innerHTML = cart
      .map(
        (item, idx) => `
        <div style="display:flex;justify-content:space-between;gap:var(--space-3);padding-block:var(--space-3);border-bottom:1px solid var(--border-subtle);">
          <div style="flex:1;">
            <span class="pill pill-lagoon" style="margin-bottom:4px;">${item.series} Series</span>
            <div style="font-weight:700;font-size:var(--text-sm);color:var(--text-primary);">${item.name}</div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">
              Size: <strong>${item.size}</strong> • Color: <strong>${item.color}</strong>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-2);">
              <button type="button" class="btn btn-outline btn-sm" data-cart-dec="${idx}" style="padding:2px 8px;">−</button>
              <span class="tabular" style="font-size:var(--text-xs);font-weight:700;">${item.qty}</span>
              <button type="button" class="btn btn-outline btn-sm" data-cart-inc="${idx}" style="padding:2px 8px;">+</button>
              <button type="button" class="btn btn-ghost btn-sm" data-cart-rem="${idx}" style="color:var(--color-coral-deep);margin-left:auto;">Remove</button>
            </div>
          </div>
          <div class="price" style="font-weight:700;font-size:var(--text-sm);">
            ${window.SuotStore.formatPrice(item.price * item.qty)}
          </div>
        </div>
      `
      )
      .join("");

    footEl.innerHTML = `
      <div class="summary-row">
        <span>Subtotal (${totals.itemCount} item/s)</span>
        <strong class="price">${window.SuotStore.formatPrice(totals.subtotal)}</strong>
      </div>
      <div class="summary-row">
        <span>Est. Island Delivery</span>
        <strong class="price">${totals.deliveryFee === 0 ? "FREE" : window.SuotStore.formatPrice(totals.deliveryFee)}</strong>
      </div>
      ${
        totals.discount > 0
          ? `<div class="summary-row" style="color:var(--color-palm);">
              <span>Promo Discount (${totals.coupon.code})</span>
              <strong class="price">−${window.SuotStore.formatPrice(totals.discount)}</strong>
            </div>`
          : ""
      }
      <div class="summary-row total">
        <span>Estimated Total</span>
        <span class="price">${window.SuotStore.formatPrice(totals.total)}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-top:var(--space-4);">
        <a href="cart.html" class="btn btn-outline">View Full Bag</a>
        <a href="checkout.html" class="btn btn-primary">Checkout</a>
      </div>
    `;

    bodyEl.querySelectorAll("[data-cart-dec]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-cart-dec"));
        window.SuotStore.updateCartQty(i, cart[i].qty - 1);
      });
    });
    bodyEl.querySelectorAll("[data-cart-inc]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-cart-inc"));
        window.SuotStore.updateCartQty(i, cart[i].qty + 1);
      });
    });
    bodyEl.querySelectorAll("[data-cart-rem]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-cart-rem"));
        window.SuotStore.removeFromCart(i);
      });
    });
  }

  function renderEmailDrawerContents() {
    const bodyEl = document.getElementById("suot-email-drawer-body");
    if (!bodyEl) return;

    const emails = window.SuotStore.getEmails();
    if (!emails.length) {
      bodyEl.innerHTML = `<p style="font-size:var(--text-sm);">No emails dispatched yet.</p>`;
      return;
    }

    bodyEl.innerHTML = emails
      .map(
        (em) => `
        <article class="email-card">
          <div class="email-meta">
            <span class="pill ${
              em.type.includes("Cancel")
                ? "pill-coral-soft"
                : em.type.includes("Ship")
                ? "pill-delivery"
                : "pill-lagoon"
            }">${em.type}</span>
            <span class="mono">${em.sentAt}</span>
          </div>
          <div class="email-subject">${em.subject}</div>
          <div style="font-size:var(--text-xs);color:var(--text-muted);">
            From: <strong>ola@suotisla.ph</strong> • To: <strong>${em.to}</strong>
          </div>
          <div class="email-body-preview">${em.body}</div>
        </article>
      `
      )
      .join("");
  }

  const SuotUI = {
    init() {
      ensureDrawersMounted();
      renderHeader();
      renderFooter();
      renderCartDrawerContents();
      renderEmailDrawerContents();

      window.addEventListener("suotisla:statechange", () => {
        renderHeader();
        renderCartDrawerContents();
        renderEmailDrawerContents();
      });
    },

    openDrawer(type) {
      ensureDrawersMounted();
      renderCartDrawerContents();
      renderEmailDrawerContents();
      document.getElementById("suot-drawer-backdrop").classList.add("open");
      if (type === "cart") {
        document.getElementById("suot-email-drawer").classList.remove("open");
        document.getElementById("suot-cart-drawer").classList.add("open");
      } else if (type === "email") {
        document.getElementById("suot-cart-drawer").classList.remove("open");
        document.getElementById("suot-email-drawer").classList.add("open");
      }
    },

    closeDrawers() {
      const backdrop = document.getElementById("suot-drawer-backdrop");
      if (backdrop) backdrop.classList.remove("open");
      document.querySelectorAll(".slide-drawer").forEach((d) => d.classList.remove("open"));
    },

    toast(message, badgeText = "Suot Isla") {
      ensureDrawersMounted();
      const container = document.getElementById("suot-toast-container");
      const el = document.createElement("div");
      el.className = "toast";
      el.innerHTML = `
        <div>
          <span class="pill pill-coral" style="margin-bottom:4px;">${badgeText}</span>
          <div style="margin-top:2px;">${message}</div>
        </div>
        <button type="button" style="background:none;border:none;color:var(--color-sand-light);cursor:pointer;font-weight:700;">✕</button>
      `;
      el.querySelector("button").addEventListener("click", () => el.remove());
      container.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.remove();
      }, 4200);
    }
  };

  window.SuotUI = SuotUI;

  document.addEventListener("DOMContentLoaded", () => {
    SuotUI.init();
  });
})();
