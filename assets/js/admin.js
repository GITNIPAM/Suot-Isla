/* ==========================================================================
   Suot Isla — Role-Based Admin, Staff & Courier Portal Controller (admin.js)
   Covers Analytics, Inventory CRUD + Image Upload, Order Fulfillment,
   Courier Dispatch, Return/Refund Processing, and Customer/Employee RBAC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  let activeTab = "analytics";
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

  // Initialize role from current user if admin/staff/courier, otherwise default to 'admin' for demo
  const currUser = window.SuotStore.getCurrentUser();
  let activeRole = ["admin", "staff", "courier"].includes(currUser.role) ? currUser.role : "admin";
  roleSelectEl.value = activeRole;

  const roleDescriptions = {
    admin: "Full access: Analytics, Product CRUD, Order Fulfillment, Returns & Refunds, and Employee RBAC.",
    staff: "Staff access: Catalog & Inventory CRUD, Order Processing, and Returns (Employee RBAC restricted).",
    courier: "Fulfillment / Courier only: Assigned dispatches and delivery status updates only."
  };

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

    // Update sidebar counts
    const prods = window.SuotStore.getProducts(true);
    const orders = window.SuotStore.getOrders();
    const returns = window.SuotStore.getReturns();
    document.getElementById("nav-prod-count").textContent = prods.length;
    document.getElementById("nav-order-count").textContent = orders.length;
    document.getElementById("nav-return-count").textContent = returns.filter((r) => r.status.includes("Pending")).length;
  }

  // -------------------- TAB 1: REPORTING & ANALYTICS --------------------
  function renderAnalyticsTab() {
    const products = window.SuotStore.getProducts(true);
    const orders = window.SuotStore.getOrders();
    const returns = window.SuotStore.getReturns();

    const totalRevenue = orders
      .filter((o) => o.status !== "Cancelled" && o.status !== "Returned")
      .reduce((sum, o) => sum + Number(o.total || 0), 0);

    const lowStockItems = products.filter((p) => p.stock <= 5);
    const topProducts = [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5);

    const seriesTotals = {
      Siargao: 142500,
      Boracay: 118900,
      "El Nido": 98400,
      "La Union": 129600
    };

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Reporting &amp; Store Analytics</h1>
          <p style="font-size:var(--text-sm);">Sales revenue, top products by Island Series, low-stock alerts, conversion, and cart abandonment metrics.</p>
        </div>
        <div style="display:flex;gap:var(--space-2);">
          <button type="button" class="btn btn-outline btn-sm" id="analytics-open-emails">View Sent Emails</button>
          <button type="button" class="btn btn-primary btn-sm" id="analytics-go-inventory">+ Add New Product</button>
        </div>
      </div>

      <div class="ops-summary-grid">
        <div class="ops-tile">
          <div class="ops-tile-title">Total Gross Revenue</div>
          <div class="ops-tile-value">${window.SuotStore.formatPrice(totalRevenue + 480000)}</div>
          <div class="ops-tile-foot">+18.4% vs prior island season • ${orders.length} active demo orders</div>
        </div>
        <div class="ops-tile">
          <div class="ops-tile-title">Store Conversion Rate</div>
          <div class="ops-tile-value">4.85%</div>
          <div class="ops-tile-foot">Cart Abandonment Rate: <strong>18.2%</strong> (Recovered via ISLA10)</div>
        </div>
        <div class="ops-tile">
          <div class="ops-tile-title">Low-Stock Alerts (≤ 5 units)</div>
          <div class="ops-tile-value" style="color:var(--color-coral-deep);">${lowStockItems.length} SKUs</div>
          <div class="ops-tile-foot">Flagged with Sun-Bleached Coral (#F27D63)</div>
        </div>
        <div class="ops-tile">
          <div class="ops-tile-title">Pending Return Requests</div>
          <div class="ops-tile-value">${returns.filter((r) => r.status.includes("Pending")).length}</div>
          <div class="ops-tile-foot">Awaiting Admin restock &amp; refund approval</div>
        </div>
      </div>

      <div class="split-checkout-grid" style="padding-block:0;">
        <!-- Top Selling Products & Revenue by Island Series -->
        <section class="surface-card">
          <h2 style="margin-top:0;font-size:var(--text-lg);margin-bottom:var(--space-4);">Revenue Breakdown by Island Series</h2>
          <div class="series-bar-list" style="margin-bottom:var(--space-8);">
            ${Object.entries(seriesTotals)
              .map(([series, amt]) => {
                const pct = Math.round((amt / 150000) * 100);
                return `
                  <div class="series-bar-item">
                    <div class="series-bar-top">
                      <span>${series} Series (4 Products)</span>
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

          <h3 style="font-size:var(--text-base);margin-bottom:var(--space-3);">Top 5 Best-Selling Products</h3>
          <div class="data-table-wrap">
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
                      <td><strong>${p.name}</strong></td>
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

        <!-- Low-Stock Alert Action Queue -->
        <aside class="surface-card">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">
            <h2 style="margin:0;font-size:var(--text-lg);">Low-Stock Alert Queue</h2>
            <span class="pill pill-coral">${lowStockItems.length} Critical</span>
          </div>
          <p style="font-size:var(--text-xs);margin-bottom:var(--space-4);">
            Items at or below 5 units in stock trigger a Sun-Bleached Coral alert badge across the storefront. Click <strong>+10 Restock</strong> to replenish immediately.
          </p>

          <div style="display:flex;flex-direction:column;gap:var(--space-3);">
            ${
              lowStockItems.length
                ? lowStockItems
                    .map(
                      (item) => `
                      <div style="display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);padding:var(--space-3);background:var(--color-coral-surface);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);">
                        <div>
                          <strong style="font-size:var(--text-sm);color:var(--text-primary);">${item.name}</strong>
                          <div class="mono" style="color:var(--color-coral-deep);">SKU: ${item.sku} • Only ${item.stock} left</div>
                        </div>
                        <button type="button" class="btn btn-primary btn-sm" data-quick-restock="${item.id}">
                          +10 Restock
                        </button>
                      </div>
                    `
                    )
                    .join("")
                : `<p style="font-size:var(--text-sm);color:var(--color-palm);">All 16 products are well-stocked above threshold.</p>`
            }
          </div>
        </aside>
      </div>
    `;

    document.getElementById("analytics-open-emails").addEventListener("click", () => window.SuotUI.openDrawer("email"));
    document.getElementById("analytics-go-inventory").addEventListener("click", () => {
      activeTab = "inventory";
      syncRolePermissions();
      renderActiveTab();
      openProductModal(null);
    });

    workspaceEl.querySelectorAll("[data-quick-restock]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-quick-restock");
        const updated = window.SuotStore.adjustStock(pid, 10, false);
        window.SuotUI.toast(`Restocked ${updated.name} (+10 units → ${updated.stock} in stock).`, "Stock Replenished");
        renderAnalyticsTab();
      });
    });
  }

  // -------------------- TAB 2: INVENTORY & PRODUCT CATALOG CRUD --------------------
  function renderInventoryTab() {
    const products = window.SuotStore.getProducts(true);

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Product Catalog &amp; Inventory Management (CRUD)</h1>
          <p style="font-size:var(--text-sm);">Create, edit, adjust stock quantities, upload product images, modify pricing, or archive products across all 4 Island Series.</p>
        </div>
        <button type="button" class="btn btn-primary" id="open-new-product-btn">
          + Create New Product
        </button>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>SKU &amp; Product Name</th>
              <th>Series &amp; Category</th>
              <th>Variants (Sizes / Colors)</th>
              <th>Price</th>
              <th>Stock Adjustment</th>
              <th>CRUD Actions</th>
            </tr>
          </thead>
          <tbody>
            ${products
              .map((p) => {
                const isLow = p.stock <= 5;
                const activeColor =
                  selectedAdminColor[p.id] && p.colors.includes(selectedAdminColor[p.id])
                    ? selectedAdminColor[p.id]
                    : p.colors[0];
                return `
                  <tr data-row-key="${p.id}" style="${p.archived ? "opacity:0.55;" : ""}">
                    <td>
                      <div style="width:52px;height:64px;background:var(--color-sand);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);overflow:hidden;">
                        ${window.SuotStore.renderProductVisual(p, activeColor)}
                      </div>
                    </td>
                    <td>
                      <div class="mono" style="color:var(--text-muted);">${p.sku}</div>
                      <strong>${p.name}</strong>
                      ${p.archived ? `<span class="pill pill-coral-soft">Archived</span>` : ""}
                    </td>
                    <td>
                      <span class="pill pill-lagoon">${p.series}</span>
                      <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:2px;">${p.category}</div>
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
                      <div style="display:flex;align-items:center;gap:6px;">
                        <button type="button" class="btn btn-outline btn-sm" data-stock-delta="-1" data-stock-id="${p.id}" style="padding:2px 8px;">−</button>
                        <span class="pill ${isLow ? "pill-coral" : "pill-delivery"} tabular">${p.stock}</span>
                        <button type="button" class="btn btn-outline btn-sm" data-stock-delta="1" data-stock-id="${p.id}" style="padding:2px 8px;">+</button>
                      </div>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button type="button" class="btn btn-outline btn-sm" data-edit-prod="${p.id}">Edit</button>
                        <button type="button" class="btn btn-outline btn-sm" data-archive-prod="${p.id}">
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
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("open-new-product-btn").addEventListener("click", () => openProductModal(null));

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
  function renderOrdersTab() {
    const orders = window.SuotStore.getOrders();

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Order Fulfillment &amp; Status Pipeline</h1>
          <p style="font-size:var(--text-sm);">Inspect customer shipping details, confirm orders, pack items, assign couriers, and trigger automated shipping update emails.</p>
        </div>
        <button type="button" class="btn btn-outline btn-sm" id="orders-open-email-drawer">
          Open Customer Email Log
        </button>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Order # &amp; Date</th>
              <th>Customer &amp; Shipping Address</th>
              <th>Ordered Items</th>
              <th>Total &amp; Payment</th>
              <th>Courier &amp; Tracking</th>
              <th>Current Status</th>
              <th>Update Status &amp; Notify</th>
            </tr>
          </thead>
          <tbody>
            ${orders
              .map(
                (o) => `
                <tr data-row-key="${o.orderNumber}">
                  <td>
                    <strong class="mono">#${o.orderNumber}</strong>
                    <div class="mono" style="color:var(--text-muted);">${o.placedAt}</div>
                  </td>
                  <td>
                    <strong>${o.customerName}</strong>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);">${o.customerEmail} • ${o.customerPhone}</div>
                    <div style="font-size:var(--text-xs);margin-top:2px;">${o.shippingAddress}</div>
                  </td>
                  <td style="font-size:var(--text-xs);">
                    <div style="display:flex;flex-direction:column;gap:6px;">
                      ${o.items
                        .map((i) => {
                          const prod = window.SuotStore.getProductById(i.productId);
                          return `
                            <div style="display:flex;align-items:center;gap:8px;">
                              <div style="width:36px;height:45px;border-radius:6px;overflow:hidden;border:1px solid var(--border-subtle);background:var(--color-sand);flex-shrink:0;">
                                ${prod ? window.SuotStore.renderProductVisual(prod, i.color) : ""}
                              </div>
                              <div>
                                <div><strong>${i.qty}× ${i.name}</strong></div>
                                <div style="color:var(--text-muted);display:flex;align-items:center;gap:4px;">
                                  <span>${i.size} ·</span>
                                  <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(i.color)};"></span>
                                  <span>${i.color}</span>
                                </div>
                              </div>
                            </div>
                          `;
                        })
                        .join("")}
                    </div>
                  </td>
                  <td>
                    <strong class="price">${window.SuotStore.formatPrice(o.total)}</strong>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);">${o.paymentMethod} (${o.paymentStatus})</div>
                  </td>
                  <td>
                    <div style="font-size:var(--text-xs);font-weight:700;">${o.courierName}</div>
                    <div class="mono" style="color:var(--text-muted);">${o.trackingNumber}</div>
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
                    <div style="display:flex;gap:6px;align-items:center;">
                      <select class="form-select" style="width:auto;padding:0.3rem 0.5rem;font-size:var(--text-xs);" data-status-select="${o.orderNumber}">
                        ${["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"]
                          .map((st) => `<option value="${st}" ${o.status === st ? "selected" : ""}>${st}</option>`)
                          .join("")}
                      </select>
                      <button type="button" class="btn btn-primary btn-sm" data-status-save="${o.orderNumber}">
                        Save &amp; Email
                      </button>
                    </div>
                  </td>
                </tr>
              `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("orders-open-email-drawer").addEventListener("click", () => window.SuotUI.openDrawer("email"));

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
        renderOrdersTab();
        flashAdminRow(ordNum);
      });
    });
  }

  // -------------------- TAB 4: COURIER / DELIVERY PERSONNEL PORTAL --------------------
  function renderCourierTab() {
    const orders = window.SuotStore.getOrders();

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Delivery Personnel / Courier Dispatch Board</h1>
          <p style="font-size:var(--text-sm);">Dedicated interface for the <strong>Delivery Personnel / Courier</strong> actor from the Use Case Diagram to assign tracking and confirm delivery.</p>
        </div>
        <span class="pill pill-delivery">Active Courier: Kuya Jomar Santos (Island Express)</span>
      </div>

      <div style="display:flex;flex-direction:column;gap:var(--space-4);">
        ${orders
          .map(
            (o) => `
            <article class="surface-card" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-4);">
              <div>
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px;">
                  <strong class="mono">#${o.orderNumber}</strong>
                  <span class="pill pill-lagoon">${o.trackingNumber}</span>
                  <span class="pill pill-delivery">${o.status}</span>
                </div>
                <div style="font-weight:700;">Recipient: ${o.customerName} (${o.customerPhone})</div>
                <div style="font-size:var(--text-sm);color:var(--text-secondary);">Drop-off Address: ${o.shippingAddress}</div>
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
                <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:4px;">
                  Payment Collection: <strong>${o.paymentMethod === "COD" ? "Collect " + window.SuotStore.formatPrice(o.total) + " Cash" : "Pre-Paid (" + o.paymentMethod + ")"}</strong>
                </div>
              </div>

              <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
                <button type="button" class="btn btn-outline btn-sm" data-courier-act="${o.orderNumber}" data-courier-status="Packed">
                  1. Mark Packed
                </button>
                <button type="button" class="btn btn-outline btn-sm" data-courier-act="${o.orderNumber}" data-courier-status="Out for Delivery">
                  2. Ship / Out for Delivery
                </button>
                <button type="button" class="btn btn-primary btn-sm" data-courier-act="${o.orderNumber}" data-courier-status="Delivered">
                  3. Confirm Delivered ✓
                </button>
              </div>
            </article>
          `
          )
          .join("")}
      </div>
    `;

    workspaceEl.querySelectorAll("[data-courier-act]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const ordNum = btn.getAttribute("data-courier-act");
        const st = btn.getAttribute("data-courier-status");
        window.SuotStore.updateOrderStatus(ordNum, st, "Kuya Jomar Santos (Island Express)");
        window.SuotUI.toast(`Courier updated #${ordNum} to "${st}" and notified customer via email!`, "Courier Dispatch");
        renderCourierTab();
      });
    });
  }

  // -------------------- TAB 5: RETURNS & REFUNDS PROCESSING --------------------
  function renderReturnsTab() {
    const returnsList = window.SuotStore.getReturns();

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Refund &amp; Return Processing</h1>
          <p style="font-size:var(--text-sm);">Review customer cancellation and return requests, restock returned items into inventory, and issue payment refunds.</p>
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
              <th>Inventory &amp; Payment Flags</th>
              <th>Status</th>
              <th>Admin Decision</th>
            </tr>
          </thead>
          <tbody>
            ${returnsList
              .map(
                (r) => `
                <tr data-row-key="${r.returnId}">
                  <td class="mono"><strong>${r.returnId}</strong><div style="color:var(--text-muted);">${r.requestedAt}</div></td>
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
                    <div>Refunded: <strong>${r.refunded ? "Yes (Paid back)" : "Pending"}</strong></div>
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
                      r.status.includes("Pending")
                        ? `<div style="display:flex;gap:6px;">
                            <button type="button" class="btn btn-primary btn-sm" data-ret-decide="${r.returnId}" data-ret-val="Approved">
                              Approve, Restock &amp; Refund
                            </button>
                            <button type="button" class="btn btn-outline btn-sm" data-ret-decide="${r.returnId}" data-ret-val="Rejected" style="color:var(--color-coral-deep);">
                              Reject
                            </button>
                          </div>`
                        : `<span style="font-size:var(--text-xs);color:var(--text-muted);">Processed</span>`
                    }
                  </td>
                </tr>
              `
              )
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
  }

  // -------------------- TAB 6: CUSTOMER & EMPLOYEE MANAGEMENT (RBAC) --------------------
  function renderUsersTab() {
    const users = window.SuotStore.getUsers();
    const orders = window.SuotStore.getOrders();

    workspaceEl.innerHTML = `
      <div class="admin-header-bar">
        <div>
          <h1>Customer &amp; Employee Management (RBAC)</h1>
          <p style="font-size:var(--text-sm);">View customer accounts, order histories, password hashes, and assign role-based permission levels (Admin, Staff, Fulfillment/Courier).</p>
        </div>
      </div>

      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Full Name &amp; Contact</th>
              <th>Bcrypt Password Hash</th>
              <th>Order Activity</th>
              <th>Current Role</th>
              <th>Assign RBAC Permission</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map((u) => {
                const userOrders = orders.filter((o) => o.customerEmail === u.email);
                return `
                  <tr>
                    <td class="mono">#USR-0${u.id}</td>
                    <td>
                      <strong>${u.name}</strong>
                      <div style="font-size:var(--text-xs);color:var(--text-muted);">${u.email} • ${u.phone}</div>
                    </td>
                    <td class="mono" style="color:var(--text-muted);">${u.passwordHash}</td>
                    <td style="font-size:var(--text-xs);">
                      ${userOrders.length ? `<strong>${userOrders.length} orders placed</strong>` : "Internal Staff / Portal User"}
                    </td>
                    <td>
                      <span class="pill ${u.role === "admin" ? "pill-coral" : u.role === "courier" ? "pill-delivery" : "pill-lagoon"}">
                        ${u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <select class="form-select" style="width:auto;padding:0.3rem 0.6rem;font-size:var(--text-xs);" data-user-role-id="${u.id}">
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
        window.SuotUI.toast(`Updated user #USR-0${uid} permission role to ${sel.value.toUpperCase()}.`, "RBAC Updated");
        renderUsersTab();
      });
    });
  }

  function renderActiveTab() {
    if (activeTab === "analytics") renderAnalyticsTab();
    else if (activeTab === "inventory") renderInventoryTab();
    else if (activeTab === "orders") renderOrdersTab();
    else if (activeTab === "courier") renderCourierTab();
    else if (activeTab === "returns") renderReturnsTab();
    else if (activeTab === "users") renderUsersTab();
  }

  roleSelectEl.addEventListener("change", () => {
    activeRole = roleSelectEl.value;
    window.SuotStore.loginAsRole(activeRole);
    syncRolePermissions();
    renderActiveTab();
    window.SuotUI.toast(`Switched portal view to ${activeRole.toUpperCase()} permission level.`, "RBAC Role Active");
  });

  document.querySelectorAll("[data-admin-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.disabled) return;
      activeTab = btn.getAttribute("data-admin-tab");
      syncRolePermissions();
      renderActiveTab();
    });
  });

  const adminEmailsBtn = document.getElementById("admin-open-emails-btn");
  if (adminEmailsBtn) {
    adminEmailsBtn.addEventListener("click", () => window.SuotUI.openDrawer("email"));
  }

  window.addEventListener("suotisla:statechange", () => {
    syncRolePermissions();
  });

  syncRolePermissions();
  renderActiveTab();
});
