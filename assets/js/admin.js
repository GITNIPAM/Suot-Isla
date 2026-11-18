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

  const currUser = window.SuotStore.getCurrentUser();
  let activeRole = ["admin", "staff", "courier"].includes(currUser.role) ? currUser.role : "admin";
  roleSelectEl.value = activeRole;

  const roleDescriptions = {
    admin: "Full analytics, catalog control, returns, and team RBAC.",
    staff: "Catalog & inventory, order fulfillment, courier handoff, and returns.",
    courier: "Active island dispatches, waybills, and delivery confirmation."
  };

  function getProductThumb(product, color) {
    if (!product) return "";
    return window.SuotStore.renderProductVisual(product, color || (product.colors && product.colors[0]));
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
    roleDescEl.textContent = roleDescriptions[activeRole] || "";
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
    const pendingRet = returns.filter((r) => r.status.includes("Pending")).length;

    document.getElementById("nav-prod-count").textContent = prods.length;
    document.getElementById("nav-order-count").textContent = awaitingPack
      ? `${awaitingPack} due`
      : String(orders.length);
    document.getElementById("nav-return-count").textContent = pendingRet;
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
    if (window.SuotMotion && typeof window.SuotMotion.initDocks === "function") {
      window.SuotMotion.initDocks(workspaceEl);
    }
  }

  // -------------------- TAB 1: REPORTING & STORE ANALYTICS --------------------
  function renderAnalyticsTab(animate = false) {
    const products = window.SuotStore.getProducts(true);
    const orders = window.SuotStore.getOrders();
    const returns = window.SuotStore.getReturns();

    const activeOrders = orders.filter((o) => o.status !== "Cancelled" && o.status !== "Returned");
    const liveRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const pendingPackOrders = orders.filter((o) => o.status === "Pending" || o.status === "Confirmed");
    const inTransitOrders = orders.filter((o) => o.status === "Packed" || o.status === "Out for Delivery");
    const lowStockItems = products.filter((p) => !p.archived && p.stock <= 5).sort((a, b) => a.stock - b.stock);
    const pendingReturns = returns.filter((r) => r.status.includes("Pending"));
    const topProducts = [...products]
      .filter((p) => !p.archived)
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 5);

    // Seasonal base totals + live revenue attribution from active orders
    const seriesTotals = {
      Siargao: 132000,
      Boracay: 112500,
      "El Nido": 94200,
      "La Union": 124800
    };
    activeOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const s = it.series || (window.SuotStore.getProductById(it.productId) || {}).series;
        if (s && seriesTotals[s] != null) {
          seriesTotals[s] += Number(it.price || 0) * Number(it.qty || 1);
        }
      });
    });
    const maxSeriesAmt = Math.max(...Object.values(seriesTotals), 150000);
    const totalUrgentActions = pendingPackOrders.length + lowStockItems.length + pendingReturns.length;

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Store Analytics &amp; Operations Command</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Real-time Philippine dispatch pipeline, critical stock watch, and seasonal performance across 4 Island Series.
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
          <button type="button" class="ops-action-chip ${pendingReturns.length ? "is-urgent" : ""}" id="attn-returns-btn">
            <span>Pending Returns</span>
            <span class="ops-action-count">${pendingReturns.length}</span>
          </button>
        </div>
      </div>

      <!-- KPI Summary Row -->
      <div class="ops-summary-grid">
        <button type="button" class="ops-tile is-interactive is-active-lagoon" id="kpi-rev-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Season &amp; Live Revenue</span>
            <span class="pill pill-delivery">+18.4%</span>
          </div>
          <div class="ops-tile-value">${window.SuotStore.formatPrice(liveRevenue + 463500)}</div>
          <div class="ops-tile-foot">${activeOrders.length} active orders · ${inTransitOrders.length} in transit</div>
        </button>

        <button type="button" class="ops-tile is-interactive ${pendingPackOrders.length ? "is-urgent-coral" : "is-active-lagoon"}" id="kpi-pack-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Orders Awaiting Pack</span>
            <span class="pill ${pendingPackOrders.length ? "pill-coral" : "pill-delivery"}">${pendingPackOrders.length ? "Needs Pack" : "Clear"}</span>
          </div>
          <div class="ops-tile-value" style="${pendingPackOrders.length ? "color:var(--color-coral-deep);" : ""}">${pendingPackOrders.length}</div>
          <div class="ops-tile-foot">Ready for Manila Hub staging &amp; courier handoff →</div>
        </button>

        <button type="button" class="ops-tile is-interactive ${lowStockItems.length ? "is-urgent-coral" : ""}" id="kpi-stock-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Low-Stock Alerts (&le; 5 units)</span>
            <span class="pill ${lowStockItems.length ? "pill-coral" : "pill-delivery"}">${lowStockItems.length ? "Urgent" : "Healthy"}</span>
          </div>
          <div class="ops-tile-value" style="${lowStockItems.length ? "color:var(--color-coral-deep);" : ""}">${lowStockItems.length} SKUs</div>
          <div class="ops-tile-foot">Click to open Low-Stock filter in Catalog →</div>
        </button>

        <button type="button" class="ops-tile is-interactive ${pendingReturns.length ? "is-urgent-coral" : ""}" id="kpi-ret-btn">
          <div class="ops-tile-top">
            <span class="ops-tile-title">Pending Return Approvals</span>
            <span class="pill ${pendingReturns.length ? "pill-coral" : "pill-sand"}">${pendingReturns.length ? "Review" : "Clear"}</span>
          </div>
          <div class="ops-tile-value">${pendingReturns.length}</div>
          <div class="ops-tile-foot">Awaiting restock inspection &amp; refund release →</div>
        </button>
      </div>

      <div class="split-checkout-grid" style="padding-block:0;">
        <!-- Island Series Breakdown + Top Sellers with Studio Thumbnails -->
        <section class="surface-card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:var(--space-4);">
            <h2 style="margin:0;font-size:var(--text-lg);">Revenue by Philippine Island Series</h2>
            <span class="mono" style="font-size:0.72rem;color:var(--text-muted);">Live order totals included</span>
          </div>

          <div class="series-bar-list" style="margin-bottom:var(--space-6);">
            ${Object.entries(seriesTotals)
              .map(([series, amt]) => {
                const pct = Math.min(100, Math.round((amt / maxSeriesAmt) * 100));
                const count = products.filter((p) => p.series === series && !p.archived).length;
                return `
                  <div class="series-bar-item">
                    <div class="series-bar-top">
                      <button type="button" class="card-size-pill" data-jump-series="${series}" style="font-weight:700;">
                        ${series} Series · ${count} SKUs →
                      </button>
                      <span class="price">${window.SuotStore.formatPrice(amt)}</span>
                    </div>
                    <div class="series-bar-track">
                      <div class="series-bar-fill" style="width:${pct}%;"></div>
                    </div>
                  </div>
                `;
              })
              .join("")}
          </div>

          <h3 style="font-size:var(--text-base);margin-bottom:var(--space-3);">Top 5 Best-Selling Pieces</h3>
          <div class="data-table-wrap" style="padding:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Series</th>
                  <th>Price</th>
                  <th>Units Sold</th>
                </tr>
              </thead>
              <tbody>
                ${topProducts
                  .map(
                    (p) => `
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
                      <td class="tabular"><strong>${p.soldCount} sold</strong></td>
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
                          <td>
                            <div style="width:52px;height:64px;background:var(--color-sand);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);overflow:hidden;">
                              ${window.SuotStore.renderProductVisual(p, activeColor)}
                            </div>
                          </td>
                          <td>
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                              <span class="mono" style="color:var(--text-muted);font-size:0.75rem;">${p.sku}</span>
                              ${isLow ? `<span class="pill pill-coral">LOW STOCK</span>` : ""}
                              ${p.archived ? `<span class="pill pill-coral-soft">Archived</span>` : ""}
                            </div>
                            <strong>${p.name}</strong>
                          </td>
                          <td>
                            <span class="pill pill-lagoon">${p.series}</span>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:3px;">${p.category}</div>
                          </td>
                          <td style="font-size:var(--text-xs);">
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
                          <td class="price"><strong>${window.SuotStore.formatPrice(p.price)}</strong></td>
                          <td>
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
                          <td>
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
        const item = window.SuotStore.toggleArchiveProduct(pid);
        window.SuotUI.toast(`${item.name} ${item.archived ? "archived from storefront" : "restored to storefront"}.`, "Catalog Updated");
        syncRolePermissions();
        renderInventoryTab();
        flashAdminRow(pid);
      });
    });

    workspaceEl.querySelectorAll("[data-delete-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-delete-prod");
        const prod = window.SuotStore.getProductById(pid);
        window.SuotStore.deleteProduct(pid);
        window.SuotUI.toast(`Deleted ${prod.name} from catalog.`, "Product Deleted");
        syncRolePermissions();
        renderInventoryTab();
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
                          <td>
                            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                              <strong class="mono">#${o.orderNumber}</strong>
                              ${needsAction ? `<span class="pill pill-lagoon">NEEDS PACK</span>` : ""}
                            </div>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">${o.placedAt}</div>
                          </td>
                          <td>
                            <strong>${o.customerName}</strong>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);">${o.customerEmail} · ${phoneDisplay}</div>
                            <div style="font-size:var(--text-xs);max-width:260px;margin-top:2px;">${o.shippingAddress}</div>
                          </td>
                          <td style="font-size:var(--text-xs);">
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
                          <td>
                            <strong class="price">${window.SuotStore.formatPrice(o.total)}</strong>
                            <div style="font-size:var(--text-xs);color:var(--text-muted);">${o.paymentMethod} (${o.paymentStatus})</div>
                          </td>
                          <td style="font-size:var(--text-xs);">
                            <div>${o.courierName}</div>
                            <span class="mono" style="color:var(--color-lagoon);">${o.trackingNumber}</span>
                          </td>
                          <td>
                            <span class="pill ${
                              o.status === "Cancelled" || o.status === "Returned"
                                ? "pill-coral"
                                : o.status === "Delivered"
                                ? "pill-palm"
                                : "pill-delivery"
                            }">${o.status}</span>
                          </td>
                          <td>
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

        window.SuotStore.updateOrderStatus(ordNum, newStatus, courier, trk);
        window.SuotUI.toast(`Order #${ordNum} updated to "${newStatus}" & email sent to customer!`, "Status & Email Sent");
        syncRolePermissions();
        renderOrdersTab();
        flashAdminRow(ordNum);
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
        window.SuotStore.updateOrderStatus(ordNum, st, "Kuya Jomar Santos (Island Express)");
        window.SuotUI.toast(`Courier updated #${ordNum} to "${st}" and notified customer via email!`, "Courier Dispatch");
        syncRolePermissions();
        renderCourierTab();
        flashAdminRow(ordNum);
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
    const returnsList = [...window.SuotStore.getReturns()].sort((a, b) =>
      a.status.includes("Pending") === b.status.includes("Pending") ? 0 : a.status.includes("Pending") ? -1 : 1
    );

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Refund &amp; Return Processing</h1>
          <p style="font-size:var(--text-sm);color:var(--text-muted);margin:0;">
            Pending approvals are highlighted at the top—inspect items, return units to inventory, and release GCash/Cash refunds.
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
              <th>Stock &amp; Refund State</th>
              <th>Status</th>
              <th>Admin Decision</th>
            </tr>
          </thead>
          <tbody>
            ${returnsList
              .map((r) => {
                const isPending = r.status.includes("Pending");
                return `
                  <tr data-row-key="${r.returnId}" class="${isPending ? "admin-row-urgent" : ""}">
                    <td class="mono">
                      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        <strong>${r.returnId}</strong>
                        ${isPending ? `<span class="pill pill-coral">ACTION</span>` : ""}
                      </div>
                      <div style="color:var(--text-muted);font-size:0.72rem;margin-top:2px;">${r.requestedAt}</div>
                    </td>
                    <td>
                      <strong class="mono">#${r.orderNumber}</strong>
                      <div style="font-size:var(--text-xs);">${r.customerName}</div>
                    </td>
                    <td>
                      <span class="pill pill-sand">${r.type}</span>
                      <div style="font-size:var(--text-xs);font-weight:700;margin-top:4px;">${r.reason}</div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted);">${r.notes || ""}</div>
                    </td>
                    <td>
                      <div style="font-size:var(--text-xs);">${r.itemSummary}</div>
                      <strong class="price">${window.SuotStore.formatPrice(r.amount)}</strong>
                    </td>
                    <td style="font-size:var(--text-xs);">
                      <div>Restocked: <strong>${r.restocked ? "Yes (+1 stock)" : "Pending"}</strong></div>
                      <div>Refunded: <strong>${r.refunded ? "Yes (Released)" : "Pending"}</strong></div>
                    </td>
                    <td>
                      <span class="pill ${
                        r.status.includes("Approved")
                          ? "pill-delivery"
                          : r.status.includes("Rejected")
                          ? "pill-coral"
                          : "pill-lagoon"
                      }">${r.status}</span>
                    </td>
                    <td>
                      ${
                        isPending
                          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;">
                              <button type="button" class="btn btn-primary btn-sm btn-pill" data-ret-decide="${r.returnId}" data-ret-val="Approved">
                                Approve &amp; Restock
                              </button>
                              <button type="button" class="btn btn-outline btn-sm btn-pill" data-ret-decide="${r.returnId}" data-ret-val="Rejected" style="color:var(--color-coral-deep);">
                                Reject
                              </button>
                            </div>`
                          : `<span style="font-size:var(--text-xs);color:var(--text-muted);">Processed</span>`
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
        window.SuotStore.processReturnRequest(retId, decision, true, true);
        window.SuotUI.toast(
          decision === "Approved"
            ? `Request ${retId} approved! Inventory restocked and refund processed.`
            : `Request ${retId} marked as rejected.`,
          "Return Processed"
        );
        syncRolePermissions();
        renderReturnsTab();
        flashAdminRow(retId);
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
                    <td class="mono">#USR-0${u.id}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:0.6rem;">
                        <span class="auth-avatar-badge" style="width:32px;height:32px;font-size:0.74rem;" aria-hidden="true">${initials}</span>
                        <div>
                          <strong>${u.name}</strong>
                          <div style="font-size:var(--text-xs);color:var(--text-muted);">${u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style="font-size:var(--text-xs);">
                      <div class="mono">${phoneDisplay}</div>
                      <div style="color:var(--text-muted);">Joined ${u.joinedAt || "2026"}</div>
                    </td>
                    <td style="font-size:var(--text-xs);">
                      ${userOrders.length ? `<strong>${userOrders.length} orders placed</strong>` : "Operations Personnel"}
                    </td>
                    <td>
                      <span class="pill ${u.role === "admin" ? "pill-coral" : u.role === "courier" ? "pill-delivery" : "pill-lagoon"}">
                        ${u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
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
    activeRole = roleSelectEl.value;
    window.SuotStore.loginAsRole(activeRole);
    navigateAdminTab(activeRole === "courier" ? "courier" : activeTab);
    window.SuotUI.toast(`Switched portal view to ${activeRole.toUpperCase()} permission level.`, "RBAC Role Active");
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

  syncRolePermissions();
  renderActiveTab(true);
});
