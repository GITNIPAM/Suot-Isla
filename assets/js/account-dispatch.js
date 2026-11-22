    document.addEventListener("DOMContentLoaded", async () => {
      const status = document.getElementById("account-status");
      const plain = value => String(value ?? "");
      const safe = value => plain(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
      async function request(endpoint, data, header = "shop") {
        const response = await fetch("api/" + endpoint + ".php", data ? {
          method:"POST", headers:{"Content-Type":"application/json","X-Suot-Request":header}, body:JSON.stringify(data)
        } : {cache:"no-store"});
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "The account service is unavailable.");
        return result;
      }
      let session, data, sales, requests, lines;
      try {
        session = (await request("account")).user;
        if (session && session.role !== "customer") { location.replace("admin.html"); return; }
        if (session) [data,sales,requests,lines] = await Promise.all([
          request("customer-data"),request("orders"),request("returns"),request("account-items")
        ]);
      } catch (error) { status.textContent = error.message; return; }
      document.getElementById("account-display").hidden = false;
      const user = session && {name:safe(session.name),email:safe(session.email),role:"customer",phone:safe(data.profile.phone)};
      const orders = (sales?.orders || []).map(row => ({
        id:row.order_id, orderNumber:safe(row.order_number), trackingNumber:safe(row.tracking_number),
        status:safe(row.order_status),paymentStatus:safe(row.payment_status),paymentMethod:safe(row.payment_method),
        placedAt:safe(row.placed_at),shippingAddress:safe(row.shipping_address_snapshot),courierName:safe(row.courier_service),
        subtotal:row.subtotal,shipping:row.delivery_fee,discount:row.discount_amount,total:row.total_amount,
        items:lines.items.filter(item => item.order_id == row.order_id).map(item => ({
          productId:safe(item.slug), name:safe(item.product_name_snapshot),color:safe(item.color_snapshot),
          size:safe(item.size_snapshot),qty:Number(item.quantity),price:Number(item.unit_price),variantId:Number(item.variant_id),
          image:/^assets\/images\/[a-zA-Z0-9_.\/-]+$/.test(item.image_url) ? item.image_url : ""
        }))
      }));
      const returnsList = (requests?.returns || []).map(row => ({
        returnId:safe(row.return_code),orderNumber:safe(row.order_number), type:safe(row.request_type.replaceAll("_"," ")),
        itemSummary:"Full order",amount:orders.find(o=>o.id==row.order_id)?.total || 0,
        reason:safe(row.reason),requestedAt:safe(row.requested_at),status:safe(row.status),refundRef:safe(row.refund_reference)
      }));
      const userAddresses = (data?.addresses || []).map(row => ({
        label:safe(row.recipient_name),street:safe(row.street_address),barangay:safe(row.barangay),
        city:safe(row.city),province:safe(row.province),postal:safe(row.postal_code),phone:safe(row.phone)
      }));
      const heroNameEl = document.getElementById("acct-hero-name");
      const userMetaEl = document.getElementById("acct-user-meta");
      const ordersListEl = document.getElementById("orders-history-list");
      const returnsTbodyEl = document.getElementById("customer-returns-tbody");
      const modalBackdrop = document.getElementById("return-modal-backdrop");
      const orderSelectEl = document.getElementById("ret-order-select");
      const typeSelectEl = document.getElementById("ret-type-select");
      const returnForm = document.getElementById("customer-return-form");
      const searchInput = document.getElementById("orders-search-input");

      const panelOrders = document.getElementById("acct-panel-orders");
      const panelReturns = document.getElementById("acct-panel-returns");
      const panelAddresses = document.getElementById("acct-panel-addresses");

      let activeSection = "orders";
      let activeOrderFilter = "all";
      let orderSearch = "";

      const stages = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

      function setWorkspaceTab(tabKey) {
        activeSection = tabKey;
        document.querySelectorAll("[data-acct-tab]").forEach((btn) => {
          const isMatch = btn.getAttribute("data-acct-tab") === tabKey;
          btn.classList.toggle("active", isMatch);
          btn.setAttribute("aria-selected", isMatch ? "true" : "false");
        });
        panelOrders.style.display = tabKey === "orders" ? "block" : "none";
        panelReturns.style.display = tabKey === "returns" ? "block" : "none";
        panelAddresses.style.display = tabKey === "addresses" ? "block" : "none";
      }

      document.querySelectorAll("[data-acct-tab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const tabKey = btn.getAttribute("data-acct-tab");
          if (window.suotTransition) {
            window.suotTransition(() => setWorkspaceTab(tabKey));
          } else {
            setWorkspaceTab(tabKey);
          }
        });
      });

      function classifyOrder(o) {
        if (o.status === "Delivered") return "delivered";
        if (o.status === "Cancelled" || o.status === "Returned") return "cancelled";
        return "active";
      }

      const signOutBtn = document.getElementById("acct-signout-btn");
      if (signOutBtn) {
        signOutBtn.addEventListener("click", async () => {
          try { await request("account",{action:"logout"},"account"); location.assign("index.html"); }
          catch(error) { status.textContent = error.message; }
        });
      }

      function renderAccountPage() {
        if (!document.body.contains(ordersListEl)) return;

        const tabsEl = document.getElementById("account-workspace-tabs");
        const emailsBtn = document.getElementById("acct-open-emails-btn");
        let authGateEl = document.getElementById("account-auth-gate");

        if (!user) {

          if (heroNameEl) heroNameEl.textContent = "Sign In.";
          if (userMetaEl) {
            userMetaEl.innerHTML = `<span class="pill pill-sand">GUEST SESSION</span><span>Sign in to view orders, tracking milestones &amp; saved addresses</span>`;
          }
          if (tabsEl) tabsEl.style.display = "none";
          if (emailsBtn) emailsBtn.style.display = "none";
          if (signOutBtn) signOutBtn.style.display = "none";
          panelOrders.style.display = "none";
          panelReturns.style.display = "none";
          panelAddresses.style.display = "none";
          const workspace = document.querySelector(".account-workspace");
          if (workspace && !authGateEl) {
            authGateEl = document.createElement("div");
            authGateEl.id = "account-auth-gate";
            authGateEl.className = "surface-card";
            authGateEl.style.cssText = "max-width:680px;margin:0 auto;text-align:center;padding:var(--space-10);";
            authGateEl.innerHTML = `
              <span class="pill pill-lagoon" style="margin-bottom:var(--space-3);">Account Required</span>
              <h2 style="margin-top:0;">Sign In to View Your Orders &amp; Dispatches</h2>
              <p style="color:var(--text-secondary);max-width:48ch;margin:var(--space-2) auto var(--space-6);">
                Sign in or create a customer account to track your Philippine deliveries, inspect official E-Receipts, and manage saved shipping addresses.
              </p>
              <div style="display:flex;justify-content:center;gap:var(--space-3);flex-wrap:wrap;">
                <a href="auth.html?redirect=account.html" class="btn btn-primary btn-pill">Sign In to Account →</a>
                <a href="auth.html?redirect=account.html&mode=register" class="btn btn-coral btn-pill">Create Customer Account →</a>
                <a href="catalog.html" class="btn btn-outline btn-pill">Continue Browsing</a>
              </div>
            `;
            workspace.appendChild(authGateEl);
          } else if (authGateEl) {
            authGateEl.style.display = "block";
          }
          return;
        }

        if (authGateEl) authGateEl.style.display = "none";
        if (tabsEl) tabsEl.style.display = "";
        if (emailsBtn) emailsBtn.style.display = "";
        if (signOutBtn) signOutBtn.style.display = "";
        setWorkspaceTab(activeSection);

        const firstName = session.name.split(" ")[0];
        if (heroNameEl) heroNameEl.textContent = `${firstName}.`;
        if (userMetaEl) {
          userMetaEl.innerHTML = `
            <a href="account-settings.html?section=profile" style="color:inherit;text-decoration:none" title="Edit profile"><strong>${user.name}</strong></a>
            <span aria-hidden="true">·</span>
            <span>${user.email}</span>
            <span aria-hidden="true">·</span>
            <span class="mono">${user.phone}</span>
            <span class="pill pill-delivery" style="font-size:0.68rem;">${user.role.toUpperCase()}</span>
          `;
        }

        const tabCountOrders = document.getElementById("tab-count-orders");
        const tabCountReturns = document.getElementById("tab-count-returns");
        const tabCountAddresses = document.getElementById("tab-count-addresses");
        if (tabCountOrders) tabCountOrders.textContent = `(${orders.length})`;
        if (tabCountReturns) tabCountReturns.textContent = `(${returnsList.length})`;
        if (tabCountAddresses) tabCountAddresses.textContent = `(${userAddresses.length})`;

        const counts = {
          all: orders.length,
          active: orders.filter((o) => classifyOrder(o) === "active").length,
          delivered: orders.filter((o) => classifyOrder(o) === "delivered").length,
          cancelled: orders.filter((o) => classifyOrder(o) === "cancelled").length
        };
        Object.keys(counts).forEach((k) => {
          const el = document.getElementById(`ord-cnt-${k}`);
          if (el) el.textContent = `(${counts[k]})`;
        });

        orderSelectEl.innerHTML = orders.length
          ? orders
              .map((o) => `<option value="${o.orderNumber}">#${o.orderNumber} — ${window.SuotStore.formatPrice(o.total)} (${o.status})</option>`)
              .join("")
          : `<option value="">No personal orders available</option>`;

        const q = orderSearch.trim().toLowerCase();
        const visibleOrders = orders.filter((o) => {
          if (activeOrderFilter !== "all" && classifyOrder(o) !== activeOrderFilter) return false;
          if (q) {
            const hay = `${o.orderNumber} ${o.trackingNumber} ${o.shippingAddress} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase();
            if (!hay.includes(q)) return false;
          }
          return true;
        });

        if (!orders.length) {
          const isOperator = ["admin", "staff", "courier"].includes(user.role);
          ordersListEl.innerHTML = `
            <div class="surface-card" style="text-align:center;padding:var(--space-12);">
              <h3 style="margin-top:0;">No Personal Orders on ${user.name}'s Account</h3>
              <p style="margin:var(--space-2) auto var(--space-5);max-width:52ch;">
                ${
                  isOperator
                    ? `For customer privacy, your personal Orders view only shows orders placed under <strong>${user.email}</strong>. To manage all shop customer orders and courier dispatches, open the Admin Operations Console.`
                    : `Orders placed under <strong>${user.email}</strong> will appear here with live 5-stage Philippine dispatch tracking.`
                }
              </p>
              <div style="display:flex;justify-content:center;gap:var(--space-3);flex-wrap:wrap;">
                <a href="catalog.html" class="btn btn-primary btn-pill">Explore the Catalog →</a>
                ${
                  isOperator
                    ? `<a href="admin.html" class="btn btn-outline btn-pill">Open Shop Orders in Admin Console →</a>`
                    : `<a href="account-settings.html?section=profile" class="btn btn-outline btn-pill">Manage Account</a>`
                }
              </div>
            </div>
          `;
        } else if (!visibleOrders.length) {
          ordersListEl.innerHTML = `
            <div class="surface-card" style="text-align:center;padding:var(--space-10);">
              <h3 style="margin-top:0;">No Matching Orders</h3>
              <p style="margin:var(--space-2) auto var(--space-5);max-width:44ch;">
                Try switching back to All Orders or clearing your search query.
              </p>
              <button type="button" class="btn btn-primary btn-pill" id="reset-orders-filter-btn">Show All Orders</button>
            </div>
          `;
          const resetOrdBtn = document.getElementById("reset-orders-filter-btn");
          if (resetOrdBtn) {
            resetOrdBtn.addEventListener("click", () => {
              activeOrderFilter = "all";
              orderSearch = "";
              if (searchInput) searchInput.value = "";
              document.querySelectorAll("[data-order-filter]").forEach((t) => {
                const isAll = t.getAttribute("data-order-filter") === "all";
                t.classList.toggle("active", isAll);
                t.setAttribute("aria-selected", isAll ? "true" : "false");
              });
              renderAccountPage();
            });
          }
        } else {
          ordersListEl.innerHTML = visibleOrders
            .map((o) => {
              const currentStageIdx = stages.indexOf(o.status);
              const isCancelledOrReturned = o.status === "Cancelled" || o.status === "Returned";

              return `
                <article class="order-showcase-card" data-order-card="${o.orderNumber}">
                  <div class="order-card-head">
                    <div>
                      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                        <strong class="mono" style="font-size:var(--text-base);color:var(--color-lagoon-ink);">#${o.orderNumber}</strong>
                        <span class="pill ${
                          isCancelledOrReturned
                            ? "pill-coral"
                            : o.status === "Delivered"
                            ? "pill-palm"
                            : "pill-delivery"
                        }">${o.status}</span>
                        <span class="pill pill-sand">${o.paymentMethod}: ${o.paymentStatus}</span>
                      </div>
                      <div style="font-size:var(--text-xs);color:var(--text-muted);margin-top:6px;">
                        Placed <strong class="tabular">${o.placedAt}</strong> · Ship to: ${o.shippingAddress}
                      </div>
                    </div>

                    <div class="order-head-summary">
                      <div class="order-head-total">${window.SuotStore.formatPrice(o.total)}</div>
                      <div class="order-head-courier">
                        ${o.courierName} • <strong>${o.trackingNumber}</strong>
                      </div>
                    </div>
                  </div>

                  ${
                    !isCancelledOrReturned
                      ? `<div class="coastal-timeline" aria-label="5-Stage Island Delivery Progress">
                          ${stages
                            .map((st, idx) => {
                              const cls = idx < currentStageIdx ? "completed" : idx === currentStageIdx ? "current" : "";
                              const marker = idx < currentStageIdx ? "✓" : idx + 1;
                              return `
                                <div class="coastal-milestone ${cls}">
                                  <span class="milestone-dot">${marker}</span>
                                  <span class="milestone-label">${st}</span>
                                </div>
                              `;
                            })
                            .join("")}
                        </div>`
                      : `<div style="margin-block:var(--space-4);padding:var(--space-3) var(--space-4);background:var(--color-coral-surface);color:var(--color-coral-deep);border-radius:var(--radius-sm);font-size:var(--text-xs);font-weight:700;">
                          Order Status: ${o.status} (${o.paymentStatus}) — Check Customer Email Outbox for full notice.
                        </div>`
                  }

                  <div class="order-items-strip">
                    ${o.items
                      .map((item) => {

                        return `
                          <div class="order-item-tile">
                            <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" class="order-item-thumb">
                              ${item.image ? '<img src="' + item.image + '" alt="">' : ""}
                            </a>
                            <div class="order-item-info">
                              <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" class="order-item-title">${item.name}</a>
                              <div class="order-item-meta" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
                                <span>${item.qty}× · Size <strong>${item.size}</strong> ·</span>
                                <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(item.color)};"></span>
                                <span>${item.color}</span>
                              </div>
                            </div>
                            <div class="order-item-right">
                              <strong class="tabular" style="font-size:0.82rem;">${window.SuotStore.formatPrice(item.price * item.qty)}</strong>
                              <button
                                type="button"
                                class="card-size-pill"
                                data-reorder-variant="${item.variantId}"
                                data-reorder-size="${item.size}"
                                data-reorder-color="${item.color}"
                              >
                                Buy Again
                              </button>
                            </div>
                          </div>
                        `;
                      })
                      .join("")}
                  </div>

                  <div class="order-card-foot">
                    <span style="font-size:var(--text-xs);color:var(--text-muted);">
                      14-day easy island exchange · Notifications archived in Order Emails
                    </span>

                    <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;">
                      <button type="button" class="btn btn-primary btn-sm btn-pill" data-view-receipt="${o.orderNumber}">
                        View E-Receipt
                      </button>
                      ${
                        o.status === "Pending" || o.status === "Confirmed"
                          ? `<button type="button" class="btn btn-outline btn-sm btn-pill" data-quick-req-order="${o.orderNumber}" data-quick-req-type="Cancellation" style="color:var(--color-coral-deep);">
                              Request Cancellation
                            </button>`
                          : ""
                      }
                      ${
                        o.status === "Delivered"
                          ? `<button type="button" class="btn btn-outline btn-sm btn-pill" data-quick-req-order="${o.orderNumber}" data-quick-req-type="Return & Refund">
                              Request Return / Refund
                            </button>`
                          : ""
                      }
                    </div>
                  </div>
                </article>
              `;
            })
            .join("");
        }

        ordersListEl.querySelectorAll("[data-reorder-variant]").forEach(btn => {
          btn.onclick = async () => {
            btn.disabled = true;
            try { await request("checkout",{action:"add",variant_id:Number(btn.dataset.reorderVariant),quantity:1}); status.textContent = "Added to your bag."; }
            catch(error) { status.textContent = error.message; }
            finally { btn.disabled = false; }
          };
        });
        ordersListEl.querySelectorAll("[data-view-receipt]").forEach(btn => {
          btn.onclick = () => {
            const order = orders.find(row => row.orderNumber === btn.dataset.viewReceipt);
            if (!order) return;
            const refund = returnsList.find(row => row.orderNumber === order.orderNumber && row.refundRef);
            window.SuotUI.openReceiptModal({
              ...order, deliveryFee: order.shipping,
              customerName: user.name, customerEmail: user.email, customerPhone: user.phone,
              refundRef: refund?.refundRef
            });
          };
        });
        ordersListEl.querySelectorAll("[data-quick-req-order]").forEach((btn) => {
          btn.addEventListener("click", () => {
            orderSelectEl.value = btn.getAttribute("data-quick-req-order");
            typeSelectEl.value = btn.getAttribute("data-quick-req-type");
            modalBackdrop.classList.add("open");
          });
        });

        // Render Returns Table scoped to signed-in account
        returnsTbodyEl.innerHTML = returnsList.length
          ? returnsList
              .map(
                (r) => `
            <tr>
              <td class="mono" style="white-space:nowrap;" data-label="Request ID"><strong>${r.returnId}</strong></td>
              <td class="mono" style="white-space:nowrap;" data-label="Order #">#${r.orderNumber}</td>
              <td data-label="Type"><span class="pill pill-sand">${r.type}</span></td>
              <td data-label="Item & Reason">
                <strong>${r.itemSummary}</strong>
                <div style="font-size:var(--text-xs);color:var(--text-muted);">Reason: ${r.reason}</div>
              </td>
              <td class="price" data-label="Refund Amount"><strong>${window.SuotStore.formatPrice(r.amount)}</strong></td>
              <td class="mono" style="white-space:nowrap;" data-label="Submitted">${r.requestedAt}</td>
              <td data-label="Status">
                <span class="pill ${
                  r.status.includes("Refunded") || r.status.includes("Closed")
                    ? "pill-delivery"
                    : r.status.includes("Awaiting Refund")
                    ? "pill-sand"
                    : r.status.includes("Rejected")
                    ? "pill-coral"
                    : "pill-lagoon"
                }">${r.status}</span>
                ${
                  r.refundRef
                    ? `<div class="mono" style="font-size:0.7rem;color:var(--text-muted);margin-top:3px;">TXN: ${r.refundRef}</div>`
                    : ""
                }
              </td>
            </tr>
          `
              )
              .join("")
          : `<tr><td colspan="7" style="text-align:center;padding:var(--space-8);color:var(--text-muted);">No return or cancellation requests submitted under ${user.email}.</td></tr>`;

        // Render Saved Delivery Addresses strictly scoped to signed-in account
        const addrGrid = document.getElementById("saved-addresses-grid");
        if (addrGrid) {
          const normPhone = user.phone;

          addrGrid.innerHTML = userAddresses.length
            ? userAddresses
                .map(
                  (a, idx) => `
                  <article class="saved-address-card">
                    <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
                      <strong style="font-family:var(--font-display);font-size:1.05rem;">${a.label || "Saved Address"}</strong>
                      <span class="pill ${idx === 0 ? "pill-delivery" : "pill-lagoon"}">${a.badge || (idx === 0 ? "Default" : a.city)}</span>
                    </div>
                    <p style="margin:0;font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">
                      ${a.label}${a.phone ? ` • <span class="mono">${a.phone}</span>` : ""}<br />
                      ${a.street}${a.barangay ? `, Brgy. ${a.barangay}` : ""}<br />
                      ${a.city}, ${a.province} ${a.postal}
                    </p>
                    <div style="margin-top:auto;padding-top:var(--space-2);">
                      <a href="checkout.html" class="btn btn-outline btn-sm btn-pill">Ship to ${a.city || "This Address"} →</a>
                    </div>
                  </article>
                `
                )
                .join("")
            : `
              <article class="saved-address-card" style="grid-column:1 / -1;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
                  <strong style="font-family:var(--font-display);font-size:1.05rem;">No Saved Delivery Addresses Yet</strong>
                  <span class="pill pill-sand">${user.email}</span>
                </div>
                <p style="margin:0;font-size:var(--text-sm);color:var(--text-secondary);line-height:1.6;">
                  This account starts with a clean address book. Your delivery address will automatically be saved here after your first checkout.
                </p>
                <div style="margin-top:auto;padding-top:var(--space-2);display:flex;gap:8px;flex-wrap:wrap;">
                  <a href="catalog.html" class="btn btn-primary btn-sm btn-pill">Browse Catalog →</a>
                  <a href="checkout.html" class="btn btn-outline btn-sm btn-pill">Go to Checkout</a>
                </div>
              </article>
            `;
        }
      }

      document.querySelectorAll("[data-order-filter]").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeOrderFilter = btn.getAttribute("data-order-filter");
          document.querySelectorAll("[data-order-filter]").forEach((t) => {
            const isMatch = t === btn;
            t.classList.toggle("active", isMatch);
            t.setAttribute("aria-selected", isMatch ? "true" : "false");
          });
          if (window.suotTransition) {
            window.suotTransition(renderAccountPage);
          } else {
            renderAccountPage();
          }
        });
      });

      if (searchInput) {
        searchInput.addEventListener("input", () => {
          orderSearch = searchInput.value;
          renderAccountPage();
        });
      }

      document.getElementById("acct-open-emails-btn").addEventListener("click", () => {
        window.SuotUI.openDrawer("email");
      });

      const openModal = () => {
        if (!orders.length) {
          window.SuotUI.toast("Place a personal order before submitting a return or cancellation request.", "No Personal Orders");
          return;
        }
        modalBackdrop.classList.add("open");
      };
      document.getElementById("open-return-modal-btn").addEventListener("click", openModal);
      const tabModalBtn = document.getElementById("open-return-modal-tab-btn");
      if (tabModalBtn) tabModalBtn.addEventListener("click", openModal);

      modalBackdrop.addEventListener("click", e => {
        if (e.target === modalBackdrop) modalBackdrop.classList.remove("open");
      });
      document.addEventListener("keydown", e => {
        if (e.key === "Escape") modalBackdrop.classList.remove("open");
      });
      document.getElementById("close-return-modal-btn").addEventListener("click", () => {
        modalBackdrop.classList.remove("open");
      });
      document.getElementById("cancel-return-modal-btn").addEventListener("click", () => {
        modalBackdrop.classList.remove("open");
      });

      returnForm.addEventListener("submit", async event => {
        event.preventDefault();
        const selected = orders.find(o=>o.orderNumber === orderSelectEl.value);
        if (!selected) { document.getElementById("request-error").textContent = "Choose an order from your account."; return; }
        const cancel = typeSelectEl.value === "Cancellation";
        const button = returnForm.querySelector("[type=submit]");
        button.disabled = true;
        try {
          await request(cancel ? "orders" : "returns", {action:cancel ? "cancel" : "request",order_id:selected.id,
            reason:document.getElementById("ret-reason-select").value,notes:document.getElementById("ret-notes").value});
          location.reload();
        } catch(error) { document.getElementById("request-error").textContent = error.message; }
        finally { button.disabled = false; }
      });
      renderAccountPage();

      function focusOrderCard(rawNum) {
        const trackedOrder = String(rawNum || "").trim().replace(/^#/, "");
        if (!trackedOrder) return;
        setWorkspaceTab("orders");
        if (activeOrderFilter !== "all" || orderSearch) {
          activeOrderFilter = "all";
          orderSearch = "";
          if (searchInput) searchInput.value = "";
          document.querySelectorAll("[data-order-filter]").forEach((t) => {
            const isAll = t.getAttribute("data-order-filter") === "all";
            t.classList.toggle("active", isAll);
            t.setAttribute("aria-selected", isAll ? "true" : "false");
          });
          renderAccountPage();
        }
        const curr = user;
        if (!curr) return;
        const targetCard = ordersListEl.querySelector(`[data-order-card="${CSS.escape(orders.find(o => o.trackingNumber === trackedOrder)?.orderNumber || trackedOrder)}"]`);
        if (targetCard) {
          targetCard.classList.remove("order-highlight-pulse");
          setTimeout(() => {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
            targetCard.classList.add("order-highlight-pulse");
          }, 120);
          status.textContent = "Showing the matching order.";
        } else {
          status.textContent = "No matching order in your account.";
        }
      }

      window.addEventListener("suotisla:focusorder", (e) => {
        if (e && e.detail && e.detail.orderNumber) {
          focusOrderCard(e.detail.orderNumber);
        }
      });

      // Deep-link highlight when navigated from homepage Track Your Order form or Email Drawer (?order=...)
      const initialTrackedOrder = new URLSearchParams(window.location.search).get("order");
      const receiptParams = new URLSearchParams(location.search);
      if (user && receiptParams.get("receipt") === "1" && receiptParams.has("order")) {
        ordersListEl.querySelector(`[data-view-receipt="${CSS.escape(receiptParams.get("order"))}"]`)?.click();
      }
      if (user && new URLSearchParams(location.search).get("section") === "notifications") document.getElementById("acct-open-emails-btn").click();
      if (initialTrackedOrder) {
        focusOrderCard(initialTrackedOrder);
      }
    });
