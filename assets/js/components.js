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
    const activeSeries = new URLSearchParams(window.location.search).get("series") || "";
    const totals = window.SuotStore.getCartTotals();
    const emails = window.SuotStore.getEmailsForCurrentUser();
    const user = window.SuotStore.getCurrentUser();
    const isCatalogAll = activePage === "catalog.html" && !activeSeries;

    mount.innerHTML = `
      <div class="dispatch-bar">
        <div class="container dispatch-bar-inner">
          <div class="dispatch-Condition">
            <span class="pill pill-delivery">PHL Island Dispatch</span>
            <span>Free shipping over ₱3,500 • Use</span>
            <button type="button" class="dispatch-code-pill" id="copy-promo-btn" title="Copy Promo Code ISLA10">
              <span>ISLA10</span>
              <span style="opacity:0.78;">· 10% OFF</span>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:0.85rem;color:var(--color-seafoam);font-weight:600;">
            <span>Manila → Siargao Express · 14-Day Easy Returns</span>
          </div>
        </div>
      </div>

      <header class="site-header ${window.scrollY > 18 ? "is-scrolled" : ""}" id="suot-site-header">
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
            <a href="account.html" class="nav-link ${activePage === "account.html" ? "active" : ""}">Orders</a>
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
              <span class="badge-count" id="header-email-count">${emails.length}</span>
            </button>

            <a href="${user ? "account.html" : "auth.html"}" class="icon-btn" title="Account &amp; Role Session">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c1.8-3.6 5-5.5 8-5.5s6.2 1.9 8 5.5"/>
              </svg>
              <span class="header-action-label" id="header-user-name">${user.name.split(" ")[0]}</span>
            </a>

            <button type="button" class="icon-btn icon-btn-bag" id="open-cart-drawer-btn" title="Open Island Shopping Bag">
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

    function renderQuickHits(query) {
      if (!searchResults) return;
      const q = (query || "").trim().toLowerCase();
      const all = window.SuotStore.getProducts();
      const matches = (q
        ? all.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.series.toLowerCase().includes(q) ||
              p.category.toLowerCase().includes(q)
          )
        : all.slice(0, 4)
      ).slice(0, 4);

      if (!matches.length) {
        searchResults.innerHTML = `<div style="color:var(--color-seafoam);font-size:0.82rem;">No island pieces matched "${query}". Press Enter to browse the catalog.</div>`;
        return;
      }

      searchResults.innerHTML = matches
        .map(
          (p) => `
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="header-search-hit">
            <span class="header-search-hit-name">${p.name}</span>
            <span class="header-search-hit-meta">${p.series} · ${window.SuotStore.formatPrice(p.price)}</span>
          </a>
        `
        )
        .join("");
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
  }

  const SPA_PAGES = new Set([
    "",
    "index.html",
    "catalog.html",
    "product.html",
    "cart.html",
    "checkout.html",
    "account.html",
    "auth.html"
  ]);
  const externalScriptCache = new Map();
  let activeNavController = null;

  function isStorefrontSpaRoute(url) {
    if (!url || !window.location.protocol.startsWith("http")) return false;
    if (!document.getElementById("site-header-mount")) return false;
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

    SuotUI.closeDrawers();
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
      const skipIds = new Set(["site-header-mount", "site-footer-mount", "suot-drawers-root"]);
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

    const skipIds = new Set(["site-header-mount", "site-footer-mount", "suot-drawers-root"]);
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

    bodyEl.innerHTML =
      SuotUI.renderShippingMeterHTML(totals.subtotal) +
      cart
        .map((item, idx) => {
          const prod = window.SuotStore.getProductById(item.productId);
          return `
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:var(--space-3);padding-block:var(--space-3);border-bottom:1px solid var(--border-subtle);">
          <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" style="width:52px;height:64px;border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border-subtle);background:var(--color-sand);flex-shrink:0;display:block;">
            ${prod ? window.SuotStore.renderProductVisual(prod, item.color) : ""}
          </a>
          <div style="flex:1;min-width:0;">
            <span class="pill pill-lagoon" style="margin-bottom:4px;">${item.series} Series</span>
            <div style="font-weight:700;font-size:var(--text-sm);color:var(--text-primary);">
              <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" style="color:inherit;text-decoration:none;">${item.name}</a>
            </div>
            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
              <span>Size: <strong>${item.size}</strong> ·</span>
              <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(item.color)};"></span>
              <span><strong>${item.color}</strong></span>
            </div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-top:var(--space-2);">
              <button type="button" class="btn btn-outline btn-sm" data-cart-dec="${idx}" style="padding:2px 8px;">−</button>
              <span class="tabular" style="font-size:var(--text-xs);font-weight:700;">${item.qty}</span>
              <button type="button" class="btn btn-outline btn-sm" data-cart-inc="${idx}" style="padding:2px 8px;">+</button>
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
        const snap = cart[i] ? { ...cart[i] } : null;
        window.SuotStore.removeFromCart(i);
        if (snap) {
          SuotUI.toast(`Removed ${snap.name} from bag.`, "Bag Updated", {
            actionLabel: "Undo",
            onAction: () => {
              window.SuotStore.addToCart(snap.productId, snap.size, snap.color, snap.qty);
              SuotUI.animateCartBadge();
            }
          });
        }
      });
    });
  }

  function renderEmailDrawerContents() {
    const bodyEl = document.getElementById("suot-email-drawer-body");
    if (!bodyEl) return;

    const isStorefront = Boolean(document.getElementById("site-header-mount"));
    const emails = isStorefront
      ? window.SuotStore.getEmailsForCurrentUser()
      : window.SuotStore.getEmails();
    if (!emails.length) {
      const user = window.SuotStore.getCurrentUser();
      bodyEl.innerHTML = `<p style="font-size:var(--text-sm);">No order emails yet for <strong>${user ? user.email : "this account"}</strong>.</p>`;
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

  let lastCartCount = null;

  function syncHeaderCounts() {
    const cartBadge = document.getElementById("header-cart-count");
    const emailBadge = document.getElementById("header-email-count");
    const userNameEl = document.getElementById("header-user-name");
    const totals = window.SuotStore.getCartTotals();
    const isStorefront = Boolean(document.getElementById("site-header-mount"));
    const emails = isStorefront
      ? window.SuotStore.getEmailsForCurrentUser()
      : window.SuotStore.getEmails();
    const user = window.SuotStore.getCurrentUser();

    if (cartBadge) {
      const prev = lastCartCount;
      cartBadge.textContent = String(totals.itemCount);
      if (prev !== null && totals.itemCount !== prev) {
        SuotUI.animateCartBadge();
      }
      lastCartCount = totals.itemCount;
    }
    if (emailBadge) {
      emailBadge.textContent = String(emails.length);
    }
    if (userNameEl && user) {
      userNameEl.textContent = user.name.split(" ")[0];
    }
  }

  const SuotUI = {
    init() {
      ensureDrawersMounted();
      initCoastalPageTransitions();
      renderHeader();
      renderFooter();
      lastCartCount = window.SuotStore.getCartTotals().itemCount;
      renderCartDrawerContents();
      renderEmailDrawerContents();

      window.addEventListener(
        "scroll",
        () => {
          const hdr = document.getElementById("suot-site-header");
          if (hdr) hdr.classList.toggle("is-scrolled", window.scrollY > 18);
        },
        { passive: true }
      );

      window.addEventListener("suotisla:statechange", () => {
        syncHeaderCounts();
        renderCartDrawerContents();
        renderEmailDrawerContents();
      });
    },

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

    animateCartBadge() {
      const badge = document.getElementById("header-cart-count");
      if (!badge) return;
      badge.classList.remove("is-popping");
      void badge.offsetWidth;
      badge.classList.add("is-popping");
      setTimeout(() => badge.classList.remove("is-popping"), 480);
    },

    flashButtonAdded(btn, tempText = "✓ Added to Bag", restoreDelay = 1150) {
      if (!btn) return;
      if (!btn.dataset.origHtml) {
        btn.dataset.origHtml = btn.innerHTML;
      }
      if (btn._addedTimer) clearTimeout(btn._addedTimer);
      btn.classList.add("is-added");
      btn.textContent = tempText;
      btn._addedTimer = setTimeout(() => {
        btn.classList.remove("is-added");
        if (btn.dataset.origHtml) {
          btn.innerHTML = btn.dataset.origHtml;
          delete btn.dataset.origHtml;
        }
      }, restoreDelay);
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
