/* ==========================================================================
   Suot Isla — Shared UI Shell, Header, Slide-Over Cart & Email Outbox Drawer
   ========================================================================== */

(function () {
  function renderStampSvg(uid, extraClass) {
    const cls = extraClass ? `brand-stamp ${extraClass}` : "brand-stamp";
    return `
      <svg class="${cls}" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <clipPath id="si-lens-${uid}">
            <circle cx="80" cy="80" r="56.5" />
          </clipPath>
          <linearGradient id="si-sky-${uid}" x1="80" y1="22" x2="80" y2="96" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#062428" />
            <stop offset="100%" stop-color="#0E5A63" />
          </linearGradient>
          <linearGradient id="si-sun-${uid}" x1="80" y1="54" x2="80" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#FFD4BF" />
            <stop offset="55%" stop-color="#F27D63" />
            <stop offset="100%" stop-color="#DA583B" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="76" fill="#FAF6EE" stroke="#092C30" stroke-width="2.5" />
        <circle cx="80" cy="80" r="68" stroke="#0E6B74" stroke-width="2" stroke-dasharray="5.4 6.468" stroke-linecap="round" />
        <line x1="80" y1="7" x2="80" y2="14" stroke="#0E6B74" stroke-width="2.4" stroke-linecap="round" />
        <line x1="80" y1="146" x2="80" y2="153" stroke="#0E6B74" stroke-width="2.4" stroke-linecap="round" />
        <polygon points="12,75 16.5,80 12,85 7.5,80" fill="#F27D63" />
        <polygon points="148,75 152.5,80 148,85 143.5,80" fill="#F27D63" />
        <circle cx="80" cy="80" r="58.5" fill="#072D32" stroke="#0E6B74" stroke-width="2.4" />
        <g clip-path="url(#si-lens-${uid})">
          <rect x="20" y="20" width="120" height="120" fill="url(#si-sky-${uid})" />
          <circle cx="80" cy="84" r="41" stroke="#FAF6EE" stroke-opacity="0.14" stroke-width="1.4" />
          <circle cx="80" cy="84" r="31" stroke="#FAF6EE" stroke-opacity="0.18" stroke-width="1.4" />
          <circle cx="80" cy="81" r="21" fill="url(#si-sun-${uid})" />
          <path d="M18 93 C42 80, 62 82, 79 92 C95 102, 114 96, 142 79 L142 142 L18 142 Z" fill="#0E6B74" />
          <path d="M18 112 C48 102, 78 104, 104 115 C120 121, 134 117, 142 109 L142 142 L18 142 Z" fill="#062226" />
          <path d="M19 92 C43 79, 63 80, 79 89 C94 98, 111 93, 117 79 C121 70, 115 59, 103 59 C92 59, 85 67, 87 74 C88 79, 93 80, 96 77" stroke="#FAF6EE" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M19 105 C49 95, 76 97, 102 107 C118 113, 132 108, 142 100" stroke="#A8D5BA" stroke-width="2.8" stroke-linecap="round" />
        </g>
      </svg>
    `;
  }

  function renderBrandLockup(uid, subtitleText) {
    return `
      ${renderStampSvg(uid)}
      <div class="brand-wordmark">
        <div class="brand-title-row">
          <span class="brand-title-strong">SUOT</span>
          <span class="brand-title-serif">Isla</span>
          <span class="brand-sun-dot" aria-hidden="true"></span>
        </div>
        <div class="brand-sub-row">
          <span class="brand-subtitle">${subtitleText}</span>
        </div>
      </div>
    `;
  }

  function getActivePage() {
    const path = window.location.pathname;
    const file = path.split("/").pop() || "index.html";
    return file.toLowerCase();
  }

  let headerEvents;
  function renderHeader() {
    headerEvents?.abort();
    headerEvents = new AbortController();
    const mount = document.getElementById("site-header-mount");
    if (!mount) return;

    const activePage = getActivePage();
    const activeSeries = new URLSearchParams(window.location.search).get("series") || "";
    const isCatalogAll = activePage === "catalog.html" && !activeSeries;

    mount.innerHTML = `
      <div class="dispatch-bar">
        <div class="container dispatch-bar-inner">
          <div class="dispatch-Condition">
            <span class="pill pill-delivery dispatch-desktop-only">PHL Island Dispatch</span>
            <span class="dispatch-desktop-only">Free shipping over ₱3,500 • Use</span>
            <span class="dispatch-mobile-only">Free ship ₱3,500+ ·</span>
            <button type="button" class="dispatch-code-pill" id="copy-promo-btn" title="Copy Promo Code ISLA10">
              <span>ISLA10</span>
              <span style="opacity:0.78;">· 10% OFF</span>
            </button>
          </div>
          <div class="dispatch-bar-secondary">
            <span>Manila → Siargao Express · 14-Day Easy Returns</span>
          </div>
        </div>
      </div>

      <header class="site-header ${window.scrollY > 18 ? "is-scrolled" : ""}" id="suot-site-header">
        <div class="container header-inner">
          <a href="index.html" class="brand-link" aria-label="Suot Isla Home">
            ${renderBrandLockup("hdr", "ISLAND-BORN SURF &amp; BEACHWEAR")}
          </a>

          <nav class="primary-nav" aria-label="Primary Navigation">
            <a href="index.html" class="nav-link ${activePage === "index.html" ? "active" : ""}">Home</a>
            <a href="catalog.html" class="nav-link ${activePage === "catalog.html" ? "active" : ""}">Catalog</a>
            <a href="auth.html?redirect=account.html" class="nav-link ${activePage === "account.html" ? "active" : ""}" id="header-orders-nav-link">Orders</a>
          </nav>

          <div class="header-actions">
            <button type="button" class="icon-btn icon-btn-icon-only" id="open-header-search-btn" title="Quick Search Catalog" aria-expanded="false" aria-controls="header-quick-search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="11" cy="11" r="7"/>
                <path d="m20 20-3.5-3.5"/>
              </svg>
            </button>

            <button type="button" class="icon-btn" id="open-email-drawer-btn" title="View Customer Order Emails">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="m3 7 9 6 9-6"/>
              </svg>
              <span class="header-action-label">Emails</span>
              <span class="badge-count" id="header-email-count">0</span>
            </button>

            <a href="auth.html" class="icon-btn header-auth-desktop" id="header-auth-link" title="Sign In or Create Account">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c1.8-3.6 5-5.5 8-5.5s6.2 1.9 8 5.5"/>
              </svg>
              <span class="header-action-label" id="header-user-name">Sign In</span>
            </a>

            <button type="button" class="icon-btn icon-btn-bag" id="open-cart-drawer-btn" title="Open Island Shopping Bag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                <path d="M3 6h18"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>Bag</span>
              <span class="badge-count" id="header-cart-count">0</span>
            </button>
          </div>
        </div>

        <div class="header-search-panel" id="header-quick-search" aria-label="Quick Catalog Search">
          <div class="container">
            <form class="header-search-row" id="header-search-form" action="catalog.html" method="GET">
              <input
                type="search"
                name="q"
                id="header-search-input"
                class="header-search-input"
                placeholder="Search boardshorts, Boracay linen, El Nido rash guard, ponchos..."
                autocomplete="off"
              />
              <button type="submit" class="btn btn-coral btn-sm btn-pill">Search Catalog</button>
              <button type="button" class="icon-btn" id="close-header-search-btn" aria-label="Close Search">✕</button>
            </form>
            <div class="header-search-results" id="header-search-results"></div>
          </div>
        </div>
      </header>
    `;

    async function refreshHeader() {
      const read = async route => {
        const response = await fetch("api/" + route + ".php",{cache:"no-store"});
        if (!response.ok) throw new Error("Header data unavailable.");
        return response.json();
      };
      const {user} = await read("account");
      syncMobileBottomNav(user);
      if (!user) return;
      document.getElementById("header-user-name").textContent = user.name.split(" ")[0];
      const account = document.getElementById("header-auth-link");
      account.href = user.role === "customer" ? "account.html" : "admin.html";
      account.title = "Account";
      document.getElementById("header-orders-nav-link").href = account.href;
      if (user.role !== "customer") return;
      const [cart,data] = await Promise.all([read("checkout"),read("customer-data")]);
      document.getElementById("header-cart-count").textContent = cart.items.reduce((n,item)=>n+Number(item.quantity),0);
      document.getElementById("header-email-count").textContent = data.emails.length;
    }
    refreshHeader().catch(()=>{});
    window.addEventListener("suotisla:bag-update",()=>refreshHeader().catch(()=>{}), {signal:headerEvents.signal});

    const cartBtn = document.getElementById("open-cart-drawer-btn");
    if (cartBtn) cartBtn.addEventListener("click", () => SuotUI.openDrawer("cart"));

    const emailBtn = document.getElementById("open-email-drawer-btn");
    if (emailBtn) emailBtn.addEventListener("click", () => SuotUI.openDrawer("email"));

    const copyPromoBtn = document.getElementById("copy-promo-btn");
    if (copyPromoBtn) {
      copyPromoBtn.addEventListener("click", () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText("ISLA10").catch(() => {});
        }
        SuotUI.toast("Promo code ISLA10 ready — apply in your bag for 10% off!", "Code Copied");
      });
    }

    const searchBtn = document.getElementById("open-header-search-btn");
    const searchPanel = document.getElementById("header-quick-search");
    const searchInput = document.getElementById("header-search-input");
    const searchResults = document.getElementById("header-search-results");
    const closeSearchBtn = document.getElementById("close-header-search-btn");

    let searchProducts;
    async function renderQuickHits(query) {
      if (!searchResults) return;
      searchProducts ??= drawerRequest("catalog").then(({variants})=>{
        const products = new Map();
        for (const row of variants) {
          const existing=products.get(row.slug);
          if (existing) existing.price=Math.min(existing.price,Number(row.unit_price));
          else products.set(row.slug,{id:row.slug,name:row.name,series:row.series,category:row.category,price:Number(row.unit_price)});
        }
        return [...products.values()];
      }).catch(error=>{searchProducts=null;throw error;});
      let all;
      try { all=await searchProducts; }
      catch {
        if (searchInput.value===query) searchResults.textContent="Search is temporarily unavailable. Open the catalog to try again.";
        return;
      }
      if (!searchResults.isConnected || searchInput.value!==query) return;
      const q=query.trim().toLowerCase();
      const matches=all.filter(product=>!q || [product.name,product.series,product.category]
        .some(value=>String(value).toLowerCase().includes(q))).slice(0,4);
      if (!matches.length) {
        searchResults.textContent='No island pieces matched "'+query+'". Press Enter to browse the catalog.';
        return;
      }
      searchResults.innerHTML=matches.map(product=>
        '<a href="product.html?id='+encodeURIComponent(product.id)+'" class="header-search-hit">'+
        '<span class="header-search-hit-name">'+escapeDrawerText(product.name)+'</span><span class="header-search-hit-meta">'+
        escapeDrawerText(product.series)+' · '+window.SuotStore.formatPrice(product.price)+'</span></a>').join("");
    }

    if (searchBtn && searchPanel && searchInput) {
      searchBtn.addEventListener("click", () => {
        const isOpen = searchPanel.classList.toggle("open");
        searchBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
        if (isOpen) {
          renderQuickHits(searchInput.value);
          setTimeout(() => searchInput.focus(), 40);
        }
      });

      searchInput.addEventListener("input", () => renderQuickHits(searchInput.value));
    }

    if (closeSearchBtn && searchPanel && searchBtn) {
      closeSearchBtn.addEventListener("click", () => {
        searchPanel.classList.remove("open");
        searchBtn.setAttribute("aria-expanded", "false");
      });
    }
  }

  function renderFooter() {
    const mount = document.getElementById("site-footer-mount");
    if (!mount) return;

    const ver = (p) => (window.SuotStore && window.SuotStore.withAssetVersion ? window.SuotStore.withAssetVersion(p) : p);
    const footerSeries = [
      { id: "Siargao", num: "01", coord: "9.85° N, 126.05° E", tag: "Wave Gear", img: ver("assets/images/footer-siargao.jpg") },
      { id: "Boracay", num: "02", coord: "11.97° N, 121.92° E", tag: "Resort Linen", img: ver("assets/images/footer-boracay.jpg") },
      { id: "El Nido", num: "03", coord: "11.20° N, 119.42° E", tag: "Lagoon Swim", img: ver("assets/images/footer-elnido.jpg") },
      { id: "La Union", num: "04", coord: "16.66° N, 120.32° E", tag: "Coastal Street", img: ver("assets/images/footer-launion.jpg") }
    ];

    mount.innerHTML = `
      <footer class="site-footer">
        <div class="footer-container">
          <div class="footer-top-band">
            <div class="footer-brand">
              <a href="index.html" class="brand-link brand-link-footer" aria-label="Suot Isla Home">
                ${renderBrandLockup("ftr", "ISLAND-BORN SURF &amp; BEACHWEAR")}
              </a>
              <p>
                Designed in Manila, cut in small island drops. Packed at our Manila Hub for Luzon, Visayas, and Mindanao ports.
              </p>
              <div class="footer-origin-stamp">
                <span class="footer-origin-dot" aria-hidden="true"></span>
                <span>MANILA HUB · 14.55° N, 121.02° E · DAILY DISPATCH</span>
              </div>
            </div>

            <div class="footer-right-cluster">
              <nav class="footer-nav-row" aria-label="Storefront &amp; Support Links">
                <a href="catalog.html">Full 16-Piece Catalog</a>
                <a href="cart.html">Shopping Bag &amp; Vouchers</a>
                <a href="account.html">Orders, Tracking &amp; Returns</a>
                <a href="auth.html">Sign In / Switch Account</a>
                <a href="mailto:ola@suotisla.ph">ola@suotisla.ph</a>
              </nav>

              <div class="footer-meta-pills" aria-label="Accepted Payments &amp; Dispatch">
                <span class="footer-meta-pill">GCash &amp; Cash on Delivery</span>
                <span class="footer-meta-pill footer-meta-pill-accent">Free Express ₱3,500+</span>
                <span class="footer-meta-pill">14-Day Easy Returns</span>
              </div>
            </div>
          </div>

          <div class="footer-archipelago-wrap">
            <div class="footer-archipelago-head">
              <h4>Philippine Archipelago</h4>
              <span class="mono" style="color:rgba(244,234,213,0.72);">4 Island Capsules · Direct Port Dispatch</span>
            </div>
            <div class="footer-series-mosaic" aria-label="4 Island Series Collections">
              ${footerSeries
                .map(
                  (s) => `
                  <a href="catalog.html?series=${encodeURIComponent(s.id)}" class="footer-island-card">
                    <img src="${s.img}" alt="${s.id} Series" class="footer-island-img" loading="lazy" />
                    <span class="footer-island-scrim" aria-hidden="true"></span>
                    <span class="footer-island-top">
                      <span class="footer-island-coord">${s.num} · ${s.coord}</span>
                      <span class="footer-island-arrow" aria-hidden="true">Explore →</span>
                    </span>
                    <span class="footer-island-body">
                      <strong class="footer-island-name">${s.id} Series</strong>
                      <span class="footer-island-tag">${s.tag}</span>
                    </span>
                  </a>
                `
                )
                .join("")}
            </div>
          </div>

          <div class="footer-bottom">
            <span>© 2026 Suot Isla — Island-Born Surf &amp; Beachwear</span>
            <div class="footer-bottom-meta">
              <button type="button" class="footer-top-btn" id="footer-scroll-top" aria-label="Scroll back to top">↑ Back to Top</button>
              <span aria-hidden="true">·</span>
              <a href="admin.html" class="footer-portal-link">Admin &amp; Operations Portal →</a>
            </div>
          </div>
        </div>
      </footer>
    `;

    const topBtn = document.getElementById("footer-scroll-top");
    if (topBtn) {
      topBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
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

      <!-- Hairline Coral-to-Seafoam Top Progress Ribbon -->
      <div class="suot-tide-transition" id="suot-tide-transition" aria-hidden="true">
        <div class="suot-tide-progress"></div>
      </div>
    `;
    document.body.appendChild(root);

    document.getElementById("suot-drawer-backdrop").addEventListener("click", () => SuotUI.closeDrawers());
    root.querySelectorAll("[data-close-drawer]").forEach((btn) => {
      btn.addEventListener("click", () => SuotUI.closeDrawers());
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (document.querySelector(".slide-drawer.open")) SuotUI.closeDrawers();
      const searchPanel = document.getElementById("header-quick-search");
      const searchBtn = document.getElementById("open-header-search-btn");
      if (searchPanel && searchPanel.classList.contains("open")) {
        searchPanel.classList.remove("open");
        if (searchBtn) searchBtn.setAttribute("aria-expanded", "false");
      }
    });
    ensureMobileBottomNav();
  }

  function ensureMobileBottomNav() {
    if (!document.getElementById("site-header-mount")) {
      document.body.classList.remove("has-mobile-bottom-nav");
      return;
    }
    document.body.classList.add("has-mobile-bottom-nav");
    let nav = document.getElementById("suot-mobile-bottom-nav");
    if (!nav) {
      nav = document.createElement("nav");
      nav.id = "suot-mobile-bottom-nav";
      nav.className = "suot-mobile-nav";
      nav.setAttribute("aria-label", "Mobile Storefront Navigation");
      nav.innerHTML = `
        <a href="index.html" class="suot-mobile-nav-item" data-mnav="index.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>
          <span>Home</span>
        </a>
        <a href="catalog.html" class="suot-mobile-nav-item" data-mnav="catalog.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          <span>Catalog</span>
        </a>
        <a href="account.html" class="suot-mobile-nav-item" id="mobile-nav-orders-link" data-mnav="account.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          <span>Orders</span>
        </a>
        <a href="auth.html" class="suot-mobile-nav-item" id="mobile-nav-account-link" data-mnav="auth.html">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.8-3.6 5-5.5 8-5.5s6.2 1.9 8 5.5"/></svg>
          <span id="mobile-nav-account-label">Account</span>
        </a>
      `;
      document.body.appendChild(nav);
    }
    syncMobileBottomNav();
  }

  function syncMobileBottomNav(user = null) {
    const nav = document.getElementById("suot-mobile-bottom-nav");
    if (!nav) return;
    const activePage = getActivePage();

    const ordersLink = document.getElementById("mobile-nav-orders-link");
    const accountLink = document.getElementById("mobile-nav-account-link");
    if (accountLink) accountLink.href = user ? (user.role === "customer" ? "account-settings.html" : "admin.html") : "auth.html";
    if (ordersLink) {
      ordersLink.setAttribute("href", user ? (user.role === "customer" ? "account.html" : "admin.html") : "auth.html?redirect=account.html");
    }
    const accountLabel = document.getElementById("mobile-nav-account-label");
    if (accountLabel) {
      accountLabel.textContent = user ? user.name.split(" ")[0] : "Sign In";
    }
    nav.querySelectorAll("[data-mnav]").forEach((link) => {
      const target = link.getAttribute("data-mnav");
      const isMatch = target === activePage || (target === "catalog.html" && activePage === "product.html");
      link.classList.toggle("is-active", isMatch);
      if (isMatch) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  const SPA_PAGES = new Set(["index.html"]);
  const externalScriptCache = new Map();
  let activeNavController = null;

  function isStorefrontSpaRoute(url) {
    if (!url || !window.location.protocol.startsWith("http")) return false;
    if (!document.getElementById("site-header-mount") || document.querySelector("[data-shop-page], #login-form")) return false;
    if (url.origin !== window.location.origin) return false;
    const file = (url.pathname.split("/").pop() || "index.html").toLowerCase();
    return SPA_PAGES.has(file);
  }

  async function ensureIncomingStylesheets(doc) {
    const existingBases = new Set(
      Array.from(document.head.querySelectorAll('link[rel="stylesheet"]')).map((l) =>
        (l.getAttribute("href") || "").split("?")[0]
      )
    );
    const loads = [];
    doc.head.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
      const href = link.getAttribute("href") || "";
      const base = href.split("?")[0];
      if (!base || existingBases.has(base)) return;
      existingBases.add(base);
      const clone = document.createElement("link");
      clone.rel = "stylesheet";
      clone.href = href;
      loads.push(
        new Promise((resolve) => {
          clone.onload = resolve;
          clone.onerror = resolve;
          setTimeout(resolve, 600);
        })
      );
      document.head.appendChild(clone);
    });
    if (loads.length) await Promise.all(loads);
  }

  async function preparePageScripts(doc) {
    const sharedScripts = new Set(["data.js", "store.js", "components.js", "ocean-overdrive.js"]);
    const tasks = [];
    const scripts = Array.from(doc.querySelectorAll("script"));

    for (const s of scripts) {
      const rawSrc = s.getAttribute("src");
      if (rawSrc) {
        const cleanFile = (rawSrc.split("?")[0].split("/").pop() || "").toLowerCase();
        if (sharedScripts.has(cleanFile)) continue;
        const absUrl = new URL(rawSrc, window.location.href).href;
        if (!externalScriptCache.has(absUrl)) {
          try {
            const resp = await fetch(absUrl, { credentials: "same-origin" });
            if (resp.ok) {
              externalScriptCache.set(absUrl, await resp.text());
            }
          } catch (_) {}
        }
        const code = externalScriptCache.get(absUrl);
        if (code) tasks.push(code);
      } else if (s.textContent && s.textContent.trim()) {
        tasks.push(s.textContent);
      }
    }
    return tasks;
  }

  function executePreparedScripts(scriptSources) {
    if (!scriptSources || !scriptSources.length) return;
    const origAdd = document.addEventListener.bind(document);
    const queued = [];
    document.addEventListener = function (type, fn, opts) {
      if (type === "DOMContentLoaded" && typeof fn === "function") {
        queued.push(fn);
        return;
      }
      return origAdd(type, fn, opts);
    };
    try {
      for (const code of scriptSources) {
        try {
          new Function(code)();
        } catch (err) {
          console.error("SuotRouter script execution error:", err);
        }
      }
    } finally {
      document.addEventListener = origAdd;
    }
    for (const fn of queued) {
      try {
        fn();
      } catch (err) {
        console.error("SuotRouter init error:", err);
      }
    }
  }

  async function performSpaMorph(destUrl, clickedEl = null, pushHistory = true) {
    if (!isStorefrontSpaRoute(destUrl)) {
      window.location.href = destUrl.href;
      return;
    }

    if (activeNavController) activeNavController.abort();
    activeNavController = new AbortController();
    const signal = activeNavController.signal;

    const prefersReduced =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tideEl = document.getElementById("suot-tide-transition");

    if (tideEl) {
      tideEl.classList.remove("is-entering");
      tideEl.classList.add("is-exiting");
    }

    let doc;
    let scriptSources;
    try {
      const resp = await fetch(destUrl.href, { credentials: "same-origin", signal });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const html = await resp.text();
      doc = new DOMParser().parseFromString(html, "text/html");
      const incomingMain = doc.querySelector("main");
      if (!incomingMain) throw new Error("Missing <main>");
      await ensureIncomingStylesheets(doc);
      scriptSources = await preparePageScripts(doc);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      window.location.href = destUrl.href;
      return;
    }

    if (signal.aborted) return;

    const searchPanel = document.getElementById("header-quick-search");
    if (searchPanel) searchPanel.classList.remove("open");

    // Tag clicked card/series visual for smooth shared-element ViewTransition morph
    const prevTagged = document.querySelectorAll('[data-vt-active="1"]');
    prevTagged.forEach((el) => {
      el.style.viewTransitionName = "";
      el.removeAttribute("data-vt-active");
    });

    const destFile = (destUrl.pathname.split("/").pop() || "index.html").toLowerCase();
    let sourceVisual = null;
    if (clickedEl && destFile === "product.html") {
      const container = clickedEl.closest(".product-card, .series-mini-item, .hero-capsule-card");
      if (container) {
        sourceVisual = container.querySelector(".studio-product-img, .product-svg-stage, img");
        if (sourceVisual) {
          sourceVisual.style.viewTransitionName = "active-piece-photo";
          sourceVisual.setAttribute("data-vt-active", "1");
        }
      }
    }

    const applyDomSwap = () => {
      if (sourceVisual) {
        sourceVisual.style.viewTransitionName = "";
        sourceVisual.removeAttribute("data-vt-active");
      }

      document.title = doc.title || document.title;

      if (pushHistory) {
        window.history.pushState({ suotSpa: true, url: destUrl.href }, "", destUrl.href);
      }

      const oldMain = document.querySelector("main");
      const rawNewMain = doc.querySelector("main");
      const importedMain = document.importNode(rawNewMain, true);
      if (oldMain) {
        oldMain.replaceWith(importedMain);
      }

      // Sync any page-specific supplemental nodes outside <main> (e.g. account.html return modal)
      document.querySelectorAll('[data-spa-extra="1"]').forEach((el) => el.remove());
      const footerMount = document.getElementById("site-footer-mount");
      const skipIds = new Set(["site-header-mount", "site-footer-mount", "suot-drawers-root", "suot-mobile-bottom-nav"]);
      Array.from(doc.body.children).forEach((child) => {
        const tag = child.tagName;
        if (tag === "MAIN" || tag === "SCRIPT" || skipIds.has(child.id)) return;
        const importedExtra = document.importNode(child, true);
        importedExtra.setAttribute("data-spa-extra", "1");
        if (footerMount && footerMount.parentNode) {
          footerMount.parentNode.insertBefore(importedExtra, footerMount);
        } else {
          document.body.appendChild(importedExtra);
        }
      });

      renderHeader();
      executePreparedScripts(scriptSources);

      if (sourceVisual && destFile === "product.html") {
        const pdpTarget = document.querySelector(".pdp-gallery .studio-product-img, .pdp-gallery .product-svg-stage");
        if (pdpTarget) {
          pdpTarget.style.viewTransitionName = "active-piece-photo";
          pdpTarget.setAttribute("data-vt-active", "1");
        }
      }

      if (pushHistory) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      if (window.SuotMotion && typeof window.SuotMotion.initPage === "function") {
        window.SuotMotion.initPage();
      }
    };

    const finishShimmer = () => {
      document.querySelectorAll('[data-vt-active="1"]').forEach((el) => {
        el.style.viewTransitionName = "";
        el.removeAttribute("data-vt-active");
      });
      if (tideEl) {
        tideEl.classList.remove("is-exiting");
        tideEl.classList.add("is-entering");
        setTimeout(() => tideEl.classList.remove("is-entering"), 320);
      }
    };

    if (typeof document.startViewTransition === "function" && !prefersReduced) {
      try {
        const vt = document.startViewTransition(applyDomSwap);
        if (vt && vt.updateCallbackDone) vt.updateCallbackDone.catch(() => {});
        if (vt && vt.ready) vt.ready.catch(() => {});
        if (vt && vt.finished) {
          vt.finished.catch(() => {}).finally(finishShimmer);
        } else {
          finishShimmer();
        }
        return;
      } catch (_) {}
    }

    applyDomSwap();
    finishShimmer();
  }

  function initCoastalPageTransitions() {
    const tideEl = document.getElementById("suot-tide-transition");
    if (!tideEl) return;

    const skipIds = new Set(["site-header-mount", "site-footer-mount", "suot-drawers-root", "suot-mobile-bottom-nav"]);
    Array.from(document.body.children).forEach((child) => {
      const tag = child.tagName;
      if (tag !== "MAIN" && tag !== "SCRIPT" && !skipIds.has(child.id)) {
        child.setAttribute("data-spa-extra", "1");
      }
    });

    window.addEventListener("pageshow", () => {
      tideEl.classList.remove("is-exiting", "is-entering");
    });

    if (window.history && !window.history.state) {
      window.history.replaceState({ suotSpa: true, url: window.location.href }, "", window.location.href);
    }

    window.addEventListener("popstate", () => {
      const targetUrl = new URL(window.location.href);
      if (isStorefrontSpaRoute(targetUrl)) {
        performSpaMorph(targetUrl, null, false);
      } else {
        window.location.reload();
      }
    });

    document.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const link = e.target.closest("a[href]");
      if (!link) return;
      if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return;

      const rawHref = link.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:") || rawHref.startsWith("javascript:")) {
        return;
      }

      let destUrl;
      try {
        destUrl = new URL(link.href, window.location.href);
      } catch (_) {
        return;
      }

      if (!isStorefrontSpaRoute(destUrl)) {
        // Admin or external full-page hop: show shimmer bar only
        tideEl.classList.remove("is-entering");
        tideEl.classList.add("is-exiting");
        return;
      }

      if (
        destUrl.pathname === window.location.pathname &&
        destUrl.search === window.location.search &&
        destUrl.hash
      ) {
        return;
      }

      e.preventDefault();
      performSpaMorph(destUrl, link, true);
    });

    document.addEventListener("submit", (e) => {
      if (e.defaultPrevented) return;
      const form = e.target.closest("form[action]");
      if (!form) return;
      if ((form.getAttribute("method") || "GET").toUpperCase() !== "GET") return;

      let destUrl;
      try {
        destUrl = new URL(form.getAttribute("action") || "", window.location.href);
      } catch (_) {
        return;
      }
      if (!isStorefrontSpaRoute(destUrl)) return;

      const qs = new URLSearchParams(new FormData(form)).toString();
      if (qs) destUrl.search = qs;
      e.preventDefault();
      performSpaMorph(destUrl, form, true);
    });
  }

  const SELECT_TONE_MAP = Object.freeze({
    Pending: "sand",
    Confirmed: "lagoon",
    Packed: "deep-teal",
    "Out for Delivery": "ocean",
    Delivered: "palm",
    Cancelled: "coral"
  });

  let activePortalSelect = null;
  let suotSelectSeq = 0;

  function buildSelectSvgMarkup(kind) {
    if (kind === "check") {
      return '<svg class="suot-select-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    }
    return '<svg class="suot-select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
  }

  function closeActiveSelectMenu(restoreFocus = false) {
    if (!activePortalSelect) return;
    activePortalSelect.close(restoreFocus);
  }

  function getOptionTone(opt) {
    if (!opt) return "";
    return SELECT_TONE_MAP[opt.value] || SELECT_TONE_MAP[opt.textContent.trim()] || "";
  }

  function positionPortalMenu(menu, trigger, isCompact) {
    const rect = trigger.getBoundingClientRect();
    const minW = Math.max(rect.width, isCompact ? 184 : 210);
    const width = Math.min(minW, Math.max(160, window.innerWidth - 20));
    const measuredH = Math.min(menu.scrollHeight || 240, 292);
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    const spaceAbove = rect.top - 10;
    const flipAbove = spaceBelow < Math.min(measuredH, 210) && spaceAbove > spaceBelow;

    let left = rect.left;
    if (left + width > window.innerWidth - 10) {
      left = Math.max(10, window.innerWidth - width - 10);
    }

    const availableSpace = flipAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(292, Math.max(132, availableSpace - 6));
    const effectiveH = Math.min(measuredH, maxHeight);
    const top = flipAbove ? Math.max(10, rect.top - effectiveH - 6) : Math.max(10, rect.bottom + 6);

    menu.classList.toggle("is-flipped", flipAbove);
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
    menu.style.minWidth = `${Math.round(width)}px`;
    menu.style.maxHeight = `${Math.round(maxHeight)}px`;
  }

  function resolveTriggerLabelAttr(sel) {
    if (sel.getAttribute("aria-label")) return { attr: "aria-label", val: sel.getAttribute("aria-label") };
    if (sel.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(sel.id)}"]`);
      if (lbl) {
        if (!lbl.id) lbl.id = `suot-lbl-${++suotSelectSeq}`;
        return { attr: "aria-labelledby", val: lbl.id };
      }
    }
    const statusOrder = sel.getAttribute("data-status-select");
    if (statusOrder) return { attr: "aria-label", val: `Order ${statusOrder} status` };
    if (sel.hasAttribute("data-user-role-id")) return { attr: "aria-label", val: "Account permission role" };
    return null;
  }

  function setupPortalSelect(sel) {
    if (!sel || sel.nodeName !== "SELECT" || sel.hasAttribute("data-native-select")) return;
    if (sel.dataset.suotSelectEnhanced === "1" && typeof sel._suotSync === "function") {
      sel._suotSync();
      return;
    }

    const parent = sel.parentNode;
    if (!parent) return;

    const inlineStyle = sel.getAttribute("style") || "";
    const isCompact =
      sel.hasAttribute("data-status-select") ||
      sel.hasAttribute("data-user-role-id") ||
      /\bwidth:\s*auto\b/i.test(inlineStyle);
    const isBold = /\bfont-weight:\s*(?:700|bold)\b/i.test(inlineStyle);
    const menuId = `suot-select-menu-${++suotSelectSeq}`;

    const wrap = document.createElement("div");
    wrap.className = `suot-select-wrap${isCompact ? " is-compact" : ""}${isBold ? " is-bold" : ""}`;
    parent.insertBefore(wrap, sel);
    wrap.appendChild(sel);

    sel.classList.add("suot-native-select-hidden");
    sel.tabIndex = -1;
    sel.setAttribute("aria-hidden", "true");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "suot-select-trigger";
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", menuId);

    const acc = resolveTriggerLabelAttr(sel);
    if (acc) trigger.setAttribute(acc.attr, acc.val);

    trigger.innerHTML = `
      <span class="suot-select-value-row">
        <span class="suot-select-dot" hidden></span>
        <span class="suot-select-label"></span>
      </span>
      ${buildSelectSvgMarkup("chevron")}
    `;
    wrap.appendChild(trigger);

    const dotEl = trigger.querySelector(".suot-select-dot");
    const labelEl = trigger.querySelector(".suot-select-label");
    const nativeValueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value");
    const nativeIdxDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "selectedIndex");

    const syncTrigger = () => {
      wrap.classList.remove("is-tone-sand", "is-tone-lagoon", "is-tone-deep-teal", "is-tone-ocean", "is-tone-palm", "is-tone-coral");
      const options = Array.from(sel.options);
      const hasTone = sel.hasAttribute("data-status-select") || options.some((opt) => !!getOptionTone(opt));
      const selectedOpt = sel.selectedOptions[0] || options[sel.selectedIndex] || options[0];

      labelEl.textContent = selectedOpt ? selectedOpt.textContent.trim() : "Select option";
      const activeTone = getOptionTone(selectedOpt);
      dotEl.hidden = !(hasTone && activeTone);
      dotEl.className = `suot-select-dot${activeTone ? ` tone-${activeTone}` : ""}`;
      if (activeTone) wrap.classList.add(`is-tone-${activeTone}`);

      trigger.disabled = !!sel.disabled;
      if (activePortalSelect && activePortalSelect.select === sel) {
        activePortalSelect.renderOptions();
      }
    };

    const commitOptionValue = (nextVal) => {
      const currentVal = nativeValueDesc ? nativeValueDesc.get.call(sel) : sel.value;
      if (currentVal !== nextVal) {
        if (nativeValueDesc && nativeValueDesc.set) {
          nativeValueDesc.set.call(sel, nextVal);
        } else {
          sel.value = nextVal;
        }
        syncTrigger();
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    };

    if (nativeValueDesc && nativeValueDesc.get && nativeValueDesc.set) {
      Object.defineProperty(sel, "value", {
        configurable: true,
        get() {
          return nativeValueDesc.get.call(this);
        },
        set(nextVal) {
          nativeValueDesc.set.call(this, nextVal);
          syncTrigger();
        }
      });
    }

    if (nativeIdxDesc && nativeIdxDesc.get && nativeIdxDesc.set) {
      Object.defineProperty(sel, "selectedIndex", {
        configurable: true,
        get() {
          return nativeIdxDesc.get.call(this);
        },
        set(nextIdx) {
          nativeIdxDesc.set.call(this, nextIdx);
          syncTrigger();
        }
      });
    }

    const openMenu = (highlightMode = "selected") => {
      if (sel.disabled || !sel.options.length || !trigger.isConnected) return;
      if (activePortalSelect && activePortalSelect.select === sel) {
        closeActiveSelectMenu(true);
        return;
      }
      closeActiveSelectMenu(false);

      const menu = document.createElement("div");
      menu.id = menuId;
      menu.className = `suot-select-menu${isCompact ? " is-compact" : ""}`;
      menu.setAttribute("role", "listbox");
      if (acc) menu.setAttribute(acc.attr, acc.val);

      let optionButtons = [];
      let highlightedIdx = -1;

      const setHighlight = (idx, scrollIntoView = true) => {
        optionButtons.forEach((btn, i) => {
          btn.classList.toggle("is-highlighted", i === idx);
        });
        highlightedIdx = idx;
        if (scrollIntoView && idx >= 0 && optionButtons[idx]) {
          optionButtons[idx].scrollIntoView({ block: "nearest" });
        }
      };

      const findEnabledIndex = (startIdx, step) => {
        if (!optionButtons.length) return -1;
        let idx = startIdx;
        for (let count = 0; count < optionButtons.length; count += 1) {
          if (idx < 0) idx = optionButtons.length - 1;
          if (idx >= optionButtons.length) idx = 0;
          if (optionButtons[idx].getAttribute("aria-disabled") !== "true") return idx;
          idx += step;
        }
        return -1;
      };

      const renderOptions = () => {
        menu.innerHTML = "";
        optionButtons = [];
        const options = Array.from(sel.options);
        const currentVal = nativeValueDesc ? nativeValueDesc.get.call(sel) : sel.value;
        const showDots = sel.hasAttribute("data-status-select") || options.some((opt) => !!getOptionTone(opt));

        options.forEach((opt, index) => {
          const optTone = getOptionTone(opt);
          if (optTone === "coral" && index > 0) {
            const sep = document.createElement("div");
            sep.className = "suot-select-separator";
            sep.setAttribute("role", "separator");
            sep.setAttribute("aria-hidden", "true");
            menu.appendChild(sep);
          }

          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "suot-select-option";
          btn.setAttribute("role", "option");
          btn.tabIndex = -1;
          btn.setAttribute("data-value", opt.value);
          btn.setAttribute("aria-selected", opt.value === currentVal ? "true" : "false");
          if (opt.disabled) btn.setAttribute("aria-disabled", "true");
          if (optTone) btn.setAttribute("data-tone", optTone);

          const mainSpan = document.createElement("span");
          mainSpan.className = "suot-select-option-main";
          if (showDots && optTone) {
            const dot = document.createElement("span");
            dot.className = `suot-select-dot tone-${optTone}`;
            dot.setAttribute("aria-hidden", "true");
            mainSpan.appendChild(dot);
          }
          const txt = document.createElement("span");
          txt.textContent = opt.textContent.trim();
          mainSpan.appendChild(txt);
          btn.appendChild(mainSpan);
          btn.insertAdjacentHTML("beforeend", buildSelectSvgMarkup("check"));

          const btnIndex = optionButtons.length;
          btn.addEventListener("pointerenter", () => {
            if (!opt.disabled) setHighlight(btnIndex, false);
          });
          btn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (opt.disabled) return;
            commitOptionValue(opt.value);
            close(true);
          });

          menu.appendChild(btn);
          optionButtons.push(btn);
        });

        const selectedIdx = options.findIndex((o) => o.value === currentVal && !o.disabled);
        const defaultIdx = selectedIdx >= 0 ? selectedIdx : findEnabledIndex(0, 1);
        setHighlight(defaultIdx, false);
      };

      const onOutsidePointerDown = (ev) => {
        if (trigger.contains(ev.target) || menu.contains(ev.target)) return;
        close(false);
      };

      const onWindowScroll = (ev) => {
        if (ev.target && ev.target !== document && menu.contains(ev.target)) return;
        close(false);
      };

      const onResize = () => {
        if (!trigger.isConnected) {
          close(false);
          return;
        }
        positionPortalMenu(menu, trigger, isCompact);
      };

      const onOpenKeyDown = (ev) => {
        if (ev.key === "ArrowDown") {
          ev.preventDefault();
          const start = highlightedIdx >= 0 ? highlightedIdx + 1 : 0;
          setHighlight(findEnabledIndex(start, 1));
        } else if (ev.key === "ArrowUp") {
          ev.preventDefault();
          const start = highlightedIdx >= 0 ? highlightedIdx - 1 : optionButtons.length - 1;
          setHighlight(findEnabledIndex(start, -1));
        } else if (ev.key === "Home") {
          ev.preventDefault();
          setHighlight(findEnabledIndex(0, 1));
        } else if (ev.key === "End") {
          ev.preventDefault();
          setHighlight(findEnabledIndex(optionButtons.length - 1, -1));
        } else if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          const activeBtn = optionButtons[highlightedIdx];
          if (activeBtn && activeBtn.getAttribute("aria-disabled") !== "true") {
            commitOptionValue(activeBtn.getAttribute("data-value") || "");
            close(true);
          }
        } else if (ev.key === "Escape") {
          ev.preventDefault();
          close(true);
        } else if (ev.key === "Tab") {
          close(false);
        }
      };

      const close = (restoreFocus = false) => {
        document.removeEventListener("pointerdown", onOutsidePointerDown, true);
        window.removeEventListener("scroll", onWindowScroll, true);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("keydown", onOpenKeyDown, true);
        trigger.setAttribute("aria-expanded", "false");
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        if (activePortalSelect && activePortalSelect.select === sel) {
          activePortalSelect = null;
        }
        if (restoreFocus && trigger.isConnected) {
          trigger.focus();
        }
      };

      renderOptions();
      document.body.appendChild(menu);
      positionPortalMenu(menu, trigger, isCompact);
      trigger.setAttribute("aria-expanded", "true");

      activePortalSelect = { select: sel, trigger, menu, close, renderOptions };

      if (highlightMode === "first") {
        setHighlight(findEnabledIndex(0, 1));
      } else if (highlightMode === "last") {
        setHighlight(findEnabledIndex(optionButtons.length - 1, -1));
      } else if (highlightedIdx >= 0 && optionButtons[highlightedIdx]) {
        optionButtons[highlightedIdx].scrollIntoView({ block: "nearest" });
      }

      requestAnimationFrame(() => {
        if (menu.isConnected) menu.classList.add("is-open");
      });

      document.addEventListener("pointerdown", onOutsidePointerDown, true);
      window.addEventListener("scroll", onWindowScroll, true);
      window.addEventListener("resize", onResize);
      document.addEventListener("keydown", onOpenKeyDown, true);
    };

    trigger.addEventListener("click", () => {
      openMenu("selected");
    });

    trigger.addEventListener("keydown", (ev) => {
      if (activePortalSelect && activePortalSelect.select === sel) return;
      if (ev.key === "ArrowDown" || ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        openMenu("selected");
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        openMenu("last");
      }
    });

    sel.addEventListener("focus", () => {
      if (!sel.disabled && trigger.isConnected) trigger.focus();
    });

    sel.addEventListener("change", syncTrigger);

    const observer = new MutationObserver(() => syncTrigger());
    observer.observe(sel, { childList: true, subtree: true, attributes: true, characterData: true });

    sel._suotSync = syncTrigger;
    sel.dataset.suotSelectEnhanced = "1";
    syncTrigger();
  }

  const escapeDrawerText = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  async function drawerRequest(endpoint, data) {
    const response = await fetch("api/"+endpoint+".php",data ? {
      method:"POST",headers:{"Content-Type":"application/json","X-Suot-Request":"shop"},body:JSON.stringify(data)
    } : {cache:"no-store"});
    const result = await response.json();
    if (!response.ok) throw Object.assign(new Error(result.message || "Could not load this drawer."),{status:response.status});
    return result;
  }

  async function renderDrawer(type) {
    const body = document.getElementById("suot-"+type+"-drawer-body");
    const footer = document.getElementById("suot-cart-drawer-footer");
    body.textContent = "Loading…";
    if (type === "cart") footer.replaceChildren();
    try {
      if (type === "cart") {
        const {items} = await drawerRequest("checkout");
        const products = items.length ? await drawerRequest("catalog").catch(() => ({variants:[]})) : {variants:[]};
        const variantById = new Map(products.variants.map(row => [Number(row.variant_id),row]));
        const cart = items.map(row => {
          const product = window.SuotStore.getProductById(row.slug);
          const variant = variantById.get(Number(row.variant_id));
          const image = /^assets\/images\/[a-zA-Z0-9_.\/-]+$/.test(variant?.image_url) && product?.image !== variant.image_url ? variant.image_url : "";
          return {productId:row.slug,name:row.name,size:row.size_label,color:row.color_name,image,
            series:variant?.series || product?.series || "Island",qty:Number(row.quantity),variantId:Number(row.variant_id),
            stock:Number(row.is_archived) ? 0 : Number(row.stock_qty),price:Number(row.unit_price),
            unitCents:Math.round(Number(row.unit_price)*100)};
        });
        const code = document.querySelector("[data-shop-page]")?.dataset.activeCoupon;
        const quote = code && cart.length ? await drawerRequest("checkout",{action:"validate",coupon:code}).catch(() => null) : null;
        renderCartDrawerContents(cart,body,footer,quote ? {code,totals:quote.totals} : null);
      } else {
        if (document.body.classList.contains("admin-portal")) {
          const {emails} = await drawerRequest("operator-outbox");
          renderEmailDrawerContents(emails, [], body, true);
        } else {
          const [{emails},{orders}] = await Promise.all([drawerRequest("customer-data"),drawerRequest("orders")]);
          renderEmailDrawerContents(emails,orders,body);
        }
      }
    } catch(error) {
      body.textContent = error.status === 401 || error.status === 403 ? "Sign in to view your "+(type === "cart" ? "shopping bag." : "order emails.") : "Could not load this drawer. Please try again.";
      if (error.status === 401 || error.status === 403) {
        const link = document.createElement("a");
        link.href = "auth.html?redirect="+(type === "cart" ? "cart.html" : "account.html");
        link.className = "btn btn-primary btn-sm";
        link.textContent = "Sign In / Create Account";
        body.append(document.createElement("p"),link);
      }
    }
  }

  function renderCartDrawerContents(cart, bodyEl, footEl, promo) {
    const subtotal = cart.reduce((sum, row) => sum + row.unitCents * row.qty, 0);
    const shipping = subtotal >= 350000 ? 0 : 15000;
    const totals = {subtotal:subtotal/100, deliveryFee:shipping/100, total:(subtotal+shipping)/100,
      itemCount:cart.reduce((sum, row)=>sum+row.qty,0)};
    if (promo) Object.assign(totals,{deliveryFee:promo.totals.delivery_fee,total:promo.totals.total,discount:promo.totals.discount});
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

    const hasStockIssues = cart.some(item => item.qty > item.stock);

    bodyEl.innerHTML =
      SuotUI.renderShippingMeterHTML(totals.subtotal) +
      (hasStockIssues
        ? `<div class="stock-recovery-panel is-compact" style="margin-bottom:var(--space-3);">
            <strong>Stock Notice:</strong> Some items exceed available warehouse units. Reduce the quantity or remove unavailable items.
          </div>`
        : "") +
      cart
        .map((item, idx) => {
          const prod = window.SuotStore.getProductById(item.productId);
          const availStock = item.stock;
          const totalInCart = item.qty;
          const iss = totalInCart > availStock;
          const incDisabled = totalInCart >= availStock;
          const stockTag =
            availStock <= 0
              ? `<span class="pill pill-coral" style="margin-left:4px;">Out of Stock</span>`
              : totalInCart > availStock
              ? `<span class="pill pill-coral" style="margin-left:4px;">Only ${availStock} left</span>`
              : availStock <= 5
              ? `<span class="pill pill-sand" style="margin-left:4px;">${availStock} left</span>`
              : "";

          return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-3);padding-block:var(--space-3);border-bottom:1px solid var(--border-subtle);${iss ? "background:rgba(242,125,99,0.06);padding-inline:8px;border-radius:var(--radius-sm);" : ""}">
          <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" style="width:52px;height:64px;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-subtle);background:var(--color-sand);flex-shrink:0;display:block;">
            ${item.image ? `<img src="${item.image}" alt="" style="width:100%;height:100%;object-fit:cover;">` : prod ? window.SuotStore.renderProductVisual(prod, item.color) : ""}
          </a>
          <div style="flex:1;min-width:0;">
            <span class="pill pill-lagoon" style="margin-bottom:4px;">${escapeDrawerText(item.series)} Series</span>${stockTag}
            <div style="font-weight:700;font-size:var(--text-sm);color:var(--text-primary);">
              <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" style="color:inherit;text-decoration:none;">${escapeDrawerText(item.name)}</a>
            </div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
              <span>Size: <strong>${escapeDrawerText(item.size)}</strong> ·</span>
              <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(item.color)};"></span>
              <span><strong>${escapeDrawerText(item.color)}</strong></span>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-2);">
              <button type="button" class="btn btn-outline btn-sm" data-cart-dec="${idx}" aria-label="Decrease quantity" ${item.stock === 0 && item.qty > 1 ? "disabled" : ""} style="padding:2px 8px;">−</button>
              <span class="tabular" style="font-size:var(--text-xs);font-weight:700;">${item.qty}</span>
              <button type="button" class="btn btn-outline btn-sm" data-cart-inc="${idx}" aria-label="Increase quantity" ${incDisabled ? "disabled title='Maximum available stock reached'" : ""} style="padding:2px 8px;">+</button>
              <button type="button" class="btn btn-ghost btn-sm" data-cart-rem="${idx}" style="color:var(--color-coral-deep);margin-left:auto;">Remove</button>
            </div>
          </div>
          <div class="price" style="font-weight:700;font-size:var(--text-sm);flex-shrink:0;">
            ${window.SuotStore.formatPrice(item.price * item.qty)}
          </div>
        </div>
      `;
        })
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
      ${totals.discount > 0 ? `<div class="summary-row"><span>Promo Discount (${escapeDrawerText(promo.code)})</span><strong class="price">−${window.SuotStore.formatPrice(totals.discount)}</strong></div>` : ""}
      <div class="summary-row total">
        <span>Estimated Total</span>
        <span class="price">${window.SuotStore.formatPrice(totals.total)}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-2);margin-top:var(--space-4);">
        <a href="cart.html" class="btn btn-outline">View Full Bag</a>
        ${
          hasStockIssues
            ? `<a href="cart.html" class="btn btn-coral">Resolve Stock</a>`
            : `<a href="checkout.html${promo ? "?coupon="+encodeURIComponent(promo.code) : ""}" class="btn btn-primary">Checkout</a>`
        }
      </div>
    `;

    bodyEl.querySelectorAll("[data-cart-dec], [data-cart-inc], [data-cart-rem]").forEach(button => {
      button.onclick = async () => {
        const {cartDec, cartInc, cartRem} = button.dataset;
        const item = cart[Number(cartDec ?? cartInc ?? cartRem)];
        const quantity = cartRem !== undefined ? 0 : cartInc !== undefined ? item.qty + 1 : Math.min(item.qty - 1,item.stock);
        [...bodyEl.querySelectorAll("button")].forEach(control => control.disabled = true);
        try {
          await drawerRequest("checkout",{action:"set",variant_id:item.variantId,quantity});
          window.dispatchEvent(new CustomEvent("suotisla:bag-update",{detail:{source:"drawer"}}));
        } catch(error) {
          SuotUI.toast(escapeDrawerText(error.message),"Shopping Bag");
        }
        if (document.getElementById("suot-cart-drawer").classList.contains("open")) renderDrawer("cart");
      };
    });
  }

  function renderEmailDrawerContents(emails, orders, body, operator = false) {
    const numbers = new Map(orders.map(order => [Number(order.order_id),order.order_number]));
    body.innerHTML = emails.map(email => {
      const order = operator ? email.order_number : numbers.get(Number(email.order_id));
      const path = operator ? "admin.html?tab=orders&search=" : "account.html?order=";
      const link = order ? path+encodeURIComponent(order) : "";
      const status = /cancel/i.test(email.email_type) ? "pill-coral-soft" : /ship/i.test(email.email_type) ? "pill-delivery" : "pill-lagoon";
      const esc = escapeDrawerText;
      return `<article class="email-card">
        <div class="email-meta"><span class="pill ${status}">${esc(email.email_type)}</span><span class="mono">${esc(email.sent_at || "Logged")}</span></div>
        <div class="email-subject">${esc(email.subject)}</div>
        <div style="font-size:var(--text-xs);color:var(--text-muted);">To <strong>${esc(email.recipient_email)}</strong></div>
        <div class="email-body-preview">${esc(email.body_preview)}</div>
        ${link ? `<div class="email-card-actions">
          <a href="${link}" class="btn btn-primary btn-sm btn-pill">${operator ? "Inspect" : "Track"} #${esc(order)} →</a>
          ${operator ? "" : `<a href="${link}&amp;receipt=1" class="btn btn-outline btn-sm btn-pill">E-Receipt</a>`}
        </div>` : ""}
      </article>`;
    }).join("") || "<p>No order notifications yet.</p>";
  }

  const SuotUI = {
    renderShippingMeterHTML(subtotal) {
      const threshold = 3500;
      const pct = Math.min(100, Math.round((Number(subtotal || 0) / threshold) * 100));
      const remaining = Math.max(0, threshold - Number(subtotal || 0));
      const unlocked = remaining === 0 && subtotal > 0;
      return `
        <div class="shipping-meter">
          <div class="shipping-meter-top">
            <span>${
              unlocked
                ? "✓ Free Philippine Island Delivery Unlocked!"
                : `Add <strong class="tabular">${window.SuotStore.formatPrice(remaining)}</strong> more for FREE island shipping`
            }</span>
            <span class="mono" style="font-size:0.7rem;color:var(--color-lagoon);">${pct}%</span>
          </div>
          <div class="shipping-meter-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
            <div class="shipping-meter-fill ${unlocked ? "is-unlocked" : ""}" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    },


    openDrawer(type) {
      ensureDrawersMounted();
      renderDrawer(type);
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


    enhanceSelects(root) {
      if (activePortalSelect && !activePortalSelect.trigger.isConnected) closeActiveSelectMenu(false);
      root.querySelectorAll("select.form-select").forEach(setupPortalSelect);
    },

    init() {
      ensureDrawersMounted();
      initCoastalPageTransitions();
      renderHeader();
      renderFooter();
      window.addEventListener(
        "scroll",
        () => {
          const hdr = document.getElementById("suot-site-header");
          if (hdr) hdr.classList.toggle("is-scrolled", window.scrollY > 18);
        },
        { passive: true }
      );

    },

    navigateTo(url) {
      let destUrl;
      try {
        destUrl = new URL(url, window.location.href);
      } catch (_) {
        window.location.href = url;
        return;
      }
      if (isStorefrontSpaRoute(destUrl)) {
        performSpaMorph(destUrl, null, true);
      } else {
        window.location.href = destUrl.href;
      }
    },

    _computeReceiptFinancials(order) {
      const items = order.items || [];
      const itemsSum = items.reduce((sum, i) => sum + Number(i.price || 0) * Number(i.qty || 1), 0);
      const subtotal = order.subtotal != null ? Number(order.subtotal) : itemsSum;
      const discount = Number(order.discount || 0);
      const deliveryFee = order.deliveryFee != null ? Number(order.deliveryFee) : 0;
      const total = order.total != null ? Number(order.total) : Math.max(0, subtotal - discount + deliveryFee);
      return { subtotal, discount, deliveryFee, total };
    },

    _renderBarcodeSvg(seedText) {
      const str = String(seedText || "SI-2026");
      let x = 4;
      const bars = [];
      for (let i = 0; i < 42; i++) {
        const code = str.charCodeAt(i % str.length);
        const w = ((code + i * 7) % 3) + 1.4;
        const gap = ((code * 3 + i) % 2) + 1.8;
        if (x + w < 216) {
          bars.push(`<rect x="${x.toFixed(1)}" y="2" width="${w.toFixed(1)}" height="30" rx="0.5" fill="#0B3338"/>`);
        }
        x += w + gap;
        if (x >= 216) break;
      }
      return `<svg class="receipt-barcode-svg" viewBox="0 0 220 34" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Order reference design">${bars.join("")}</svg>`;
    },

    _renderReceiptMarkup(order, options = {}) {
      const fin = this._computeReceiptFinancials(order);
      const phone = window.SuotStore.normalizePhMobile(order.customerPhone) || order.customerPhone || "";
      const isRefunded = order.paymentStatus === "Refunded";
      const isRefundPending = order.paymentStatus === "Refund Pending";
      const isCancelled = order.status === "Cancelled";
      const isPaid = !isRefunded && !isRefundPending && !isCancelled && (order.paymentStatus === "Paid");
      const badgeClass = isRefunded || isCancelled ? "pill-coral" : isPaid ? "pill-delivery" : "pill-sand";
      const badgeLabel = isRefunded
        ? "REFUNDED"
        : isRefundPending
        ? "REFUND PENDING"
        : isCancelled
        ? "CANCELLED"
        : isPaid
        ? "PAID"
        : order.paymentMethod === "COD"
        ? "COD UPON DELIVERY"
        : "PENDING";

      const itemRows = (order.items || [])
        .map((item) => {
          const product = window.SuotStore.getProductById(item.productId);
          const image = product && product.image === item.image ? window.SuotStore.getProductImageForColor(product, item.color) : item.image;
          const thumbHtml = options.forDownload
            ? ""
            : `<div class="receipt-item-thumb">${image ? `<img src="${image}" alt="">` : ""}</div>`;
          const dotColor = window.SuotStore.getColorHex(item.color);
          return `
            <div class="receipt-item-row">
              ${thumbHtml}
              <div style="min-width:0;">
                <div class="receipt-item-name">${item.qty}× ${item.name}</div>
                <div class="receipt-item-spec">
                  <span>${item.size} ·</span>
                  <span class="inline-color-dot" style="background-color:${dotColor};"></span>
                  <span>${item.color}</span>
                  <span>· ${window.SuotStore.formatPrice(item.price)} ea</span>
                </div>
              </div>
              <strong class="price" style="font-size:0.84rem;white-space:nowrap;">${window.SuotStore.formatPrice(Number(item.price) * Number(item.qty || 1))}</strong>
            </div>
          `;
        })
        .join("");

      return `
        <article class="receipt-sheet" data-receipt-order="${order.orderNumber}" aria-label="Official Order Receipt ${order.orderNumber}">
          <div class="receipt-head">
            <div class="receipt-brand-row">
              ${renderStampSvg(options.forDownload ? "rcp-dl" : options.embedded ? "rcp-emb" : "rcp-mod", 38)}
              <div class="receipt-title-stack">
                <strong>SUOT Isla · Official E-Receipt</strong>
                <span>Manila Hub · 14.55° N, 121.02° E</span>
              </div>
            </div>
            <div class="receipt-status-col">
              <span class="pill ${badgeClass}">${badgeLabel}</span>
              <span class="mono" style="font-size:0.6875rem;color:var(--text-muted);">${order.placedAt || ""}</span>
            </div>
          </div>

          <div class="receipt-meta-grid">
            <div>
              <span class="receipt-meta-label">Receipt / Order #</span>
              <div class="receipt-meta-val mono">#${order.orderNumber}</div>
            </div>
            <div>
              <span class="receipt-meta-label">Tracking Reference</span>
              <div class="receipt-meta-val mono">${order.trackingNumber || "ISLA-TRK-PENDING"}</div>
            </div>
            <div>
              <span class="receipt-meta-label">Billed Customer</span>
              <div class="receipt-meta-val">${order.customerName}</div>
              <div style="font-size:0.72rem;color:var(--text-muted);">${order.customerEmail}${phone ? ` · ${phone}` : ""}</div>
            </div>
            <div>
              <span class="receipt-meta-label">Payment Method</span>
              <div class="receipt-meta-val">${order.paymentMethod || "—"}</div>
              <div class="mono" style="font-size:0.7rem;color:var(--text-muted);">${order.paymentRef || ""}</div>
              ${
                order.refundRef
                  ? `<div class="mono" style="font-size:0.7rem;color:var(--color-coral-deep);font-weight:700;">Refund TXN: ${order.refundRef}</div>`
                  : ""
              }
            </div>
            <div style="grid-column:1 / -1;">
              <span class="receipt-meta-label">Shipping Destination</span>
              <div class="receipt-meta-val">${order.shippingAddress || ""}</div>
            </div>
          </div>

          <div class="receipt-items-list">
            ${itemRows}
          </div>

          <div class="receipt-totals">
            <div class="receipt-total-row">
              <span>Merchandise Subtotal</span>
              <span class="price">${window.SuotStore.formatPrice(fin.subtotal)}</span>
            </div>
            ${
              fin.discount > 0
                ? `<div class="receipt-total-row" style="color:var(--color-palm);">
                    <span>Island Promo Discount</span>
                    <span class="price">−${window.SuotStore.formatPrice(fin.discount)}</span>
                  </div>`
                : ""
            }
            <div class="receipt-total-row">
              <span>Island Express Shipping</span>
              <span class="price">${fin.deliveryFee === 0 ? "FREE" : window.SuotStore.formatPrice(fin.deliveryFee)}</span>
            </div>
            <div class="receipt-total-row is-grand">
              <span>${isRefunded ? "Order Total (Refunded)" : isCancelled || isRefundPending ? "Original Order Total" : isPaid ? "Total Paid" : order.paymentMethod === "COD" ? "Total Due on Delivery" : "Total Due"}</span>
              <span class="price">${window.SuotStore.formatPrice(fin.total)}</span>
            </div>
          </div>

          <div class="receipt-barcode-wrap">
            ${this._renderBarcodeSvg(order.orderNumber + (order.trackingNumber || ""))}
            <div class="receipt-barcode-caption">${order.orderNumber} · ${order.trackingNumber || "SUOT-ISLA"}</div>
          </div>

          ${
            options.forDownload
              ? `<div class="receipt-actions no-print" style="justify-content:center;">
                  <button type="button" onclick="window.print()" style="padding:0.55rem 1.2rem;border-radius:999px;border:none;background:#0E6B74;color:#FAF6EE;font-weight:700;cursor:pointer;">Print / Save as PDF</button>
                </div>`
              : `<div class="receipt-actions no-print">
                  <button type="button" class="btn btn-primary btn-sm" data-receipt-print="${order.orderNumber}">
                    Print / Save PDF
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" data-receipt-download="${order.orderNumber}">
                    Download E-Receipt (.html)
                  </button>
                  ${
                    options.embedded
                      ? ""
                      : `<button type="button" class="btn btn-outline btn-sm" style="margin-left:auto;" data-receipt-close>Close</button>`
                  }
                </div>`
          }
        </article>
      `;
    },

    _bindReceiptActions(scope, order) {
      scope.querySelector("[data-receipt-print]").onclick = () => {
        if (!scope.closest(".receipt-modal-dialog")) this.openReceiptModal(order);
        this.printOrderReceipt();
      };
      scope.querySelector("[data-receipt-download]").onclick = () => this.downloadOrderReceipt(order);
      const close = scope.querySelector("[data-receipt-close]");
      if (close) close.onclick = () => this.closeReceiptModal();
    },

    renderReceiptSheet(order, mount) {
      mount.innerHTML = this._renderReceiptMarkup(order, {embedded:true});
      this._bindReceiptActions(mount, order);
    },

    _ensureReceiptModal() {
      let backdrop = document.getElementById("suot-receipt-modal-backdrop");
      if (backdrop) return backdrop;
      backdrop = document.createElement("div");
      backdrop.id = "suot-receipt-modal-backdrop";
      backdrop.className = "receipt-modal-backdrop";
      backdrop.setAttribute("role", "dialog");
      backdrop.setAttribute("aria-modal", "true");
      backdrop.setAttribute("aria-label", "Official Order E-Receipt");
      backdrop.innerHTML = `<div class="receipt-modal-dialog" id="suot-receipt-modal-body"></div>`;
      document.body.appendChild(backdrop);

      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.closeReceiptModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && backdrop.classList.contains("open")) {
          this.closeReceiptModal();
        }
        if (e.key !== "Tab" || !backdrop.classList.contains("open")) return;
        const buttons = [...backdrop.querySelectorAll("button")];
        const index = buttons.indexOf(document.activeElement);
        if (index < 0 || index === (e.shiftKey ? 0 : buttons.length - 1)) {
          e.preventDefault();
          buttons[e.shiftKey ? buttons.length - 1 : 0].focus();
        }
      });
      return backdrop;
    },

    openReceiptModal(order) {
      const backdrop = this._ensureReceiptModal();
      const body = document.getElementById("suot-receipt-modal-body");
      body.innerHTML = this._renderReceiptMarkup(order);
      this._bindReceiptActions(body, order);
      this.receiptTrigger = document.activeElement;
      backdrop.classList.add("open");
      body.querySelector("[data-receipt-close]").focus();
    },

    closeReceiptModal() {
      const backdrop = document.getElementById("suot-receipt-modal-backdrop");
      if (!backdrop?.classList.contains("open")) return;
      backdrop.classList.remove("open");
      this.receiptTrigger?.focus();
      this.receiptTrigger = null;
    },

    printOrderReceipt() {
      document.body.classList.add("is-printing-receipt");
      const cleanup = () => document.body.classList.remove("is-printing-receipt");
      window.addEventListener("afterprint", cleanup, { once: true });
      setTimeout(() => {
        window.print();
        setTimeout(cleanup, 1200);
      }, 60);
    },

    downloadOrderReceipt(order) {
      const bodyMarkup = this._renderReceiptMarkup(order, { forDownload: true });
      const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Suot Isla Receipt — #${order.orderNumber}</title>
<style>
  body { margin: 0; padding: 32px 16px; background: #F4EAD5; font-family: system-ui, -apple-system, sans-serif; color: #0B3338; }
  .wrap { max-width: 560px; margin: 0 auto; }
  .receipt-sheet { position: relative; background: #FFFDF8; border: 1px solid rgba(11,51,56,0.18); border-radius: 16px; padding: 26px; box-shadow: 0 20px 45px rgba(7,34,38,0.12); overflow: hidden; }
  .receipt-sheet::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #072226 0%, #0E6B74 55%, #F27D63 100%); }
  .receipt-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding-bottom: 16px; border-bottom: 1px dashed rgba(11,51,56,0.22); }
  .receipt-brand-row { display: flex; align-items: center; gap: 10px; }
  .receipt-title-stack strong { display: block; font-size: 16px; color: #072226; }
  .receipt-title-stack span, .mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 11px; color: #4A6A6E; }
  .receipt-status-col { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .pill { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #D7EFE3; color: #0E6B74; }
  .receipt-meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; padding: 16px 0; border-bottom: 1px dashed rgba(11,51,56,0.22); font-size: 13px; }
  .receipt-meta-label { display: block; font-family: ui-monospace, monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #4A6A6E; margin-bottom: 2px; }
  .receipt-meta-val { font-weight: 600; }
  .receipt-items-list { display: flex; flex-direction: column; gap: 10px; padding: 16px 0; border-bottom: 1px dashed rgba(11,51,56,0.22); }
  .receipt-item-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 10px; align-items: center; }
  .receipt-item-name { font-size: 13px; font-weight: 700; }
  .receipt-item-spec { font-size: 11px; color: #4A6A6E; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .inline-color-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; border: 1px solid rgba(0,0,0,0.2); }
  .receipt-totals { padding: 16px 0; border-bottom: 1px dashed rgba(11,51,56,0.22); display: flex; flex-direction: column; gap: 6px; font-size: 13px; }
  .receipt-total-row { display: flex; justify-content: space-between; }
  .receipt-total-row.is-subtle { font-size: 12px; color: #4A6A6E; }
  .receipt-total-row.is-grand { margin-top: 6px; padding-top: 8px; border-top: 1px solid rgba(11,51,56,0.16); font-size: 17px; font-weight: 800; color: #072226; }
  .price { font-variant-numeric: tabular-nums; }
  .receipt-barcode-wrap { padding-top: 16px; text-align: center; }
  .receipt-barcode-svg { width: 100%; max-width: 240px; height: 36px; display: block; margin: 0 auto 6px; }
  .receipt-barcode-caption { font-family: ui-monospace, monospace; font-size: 11px; color: #4A6A6E; letter-spacing: 0.06em; }
  @media print { body { background: #FFFFFF; padding: 0; } .receipt-sheet { box-shadow: none; } .no-print { display: none !important; } }
</style>
</head>
<body><div class="wrap">${bodyMarkup}</div></body>
</html>`;
      const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Suot-Isla-Receipt-${order.orderNumber}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast(`Downloaded official receipt Suot-Isla-Receipt-${order.orderNumber}.html`, "E-Receipt Saved");
    },

    toast(message, badgeText = "Suot Isla", options = {}) {
      ensureDrawersMounted();
      const container = document.getElementById("suot-toast-container");
      const el = document.createElement("div");
      el.className = "toast";

      const hasAction = options && options.actionLabel && typeof options.onAction === "function";
      el.innerHTML = `
        <div>
          <span class="pill pill-coral" style="margin-bottom:4px;">${badgeText}</span>
          <div style="margin-top:2px;">${message}</div>
        </div>
        <div class="toast-actions">
          ${hasAction ? `<button type="button" class="toast-action-btn">${options.actionLabel}</button>` : ""}
          <button type="button" class="toast-dismiss-btn" aria-label="Dismiss" style="background:none;border:none;color:var(--color-sand-light);cursor:pointer;font-weight:700;">✕</button>
        </div>
      `;

      const dismiss = () => {
        if (!el.parentNode || el.classList.contains("is-leaving")) return;
        el.classList.add("is-leaving");
        setTimeout(() => {
          if (el.parentNode) el.remove();
        }, 220);
      };

      if (hasAction) {
        el.querySelector(".toast-action-btn").addEventListener("click", () => {
          options.onAction();
          dismiss();
        });
      }
      el.querySelector(".toast-dismiss-btn").addEventListener("click", dismiss);

      container.appendChild(el);

      let hideTimer = setTimeout(dismiss, 4200);
      el.addEventListener("mouseenter", () => clearTimeout(hideTimer));
      el.addEventListener("mouseleave", () => {
        hideTimer = setTimeout(dismiss, 1800);
      });
    }
  };

  window.SuotUI = SuotUI;

  document.addEventListener("DOMContentLoaded", () => {
    SuotUI.init();
  });
})();
