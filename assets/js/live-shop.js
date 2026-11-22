(() => {
  const root = document.querySelector("[data-shop-page]");
  if (!root) return;
  const page = root.dataset.shopPage;
  const params = new URLSearchParams(location.search);
  const money = value => new Intl.NumberFormat("en-PH", {style:"currency", currency:"PHP"}).format(value);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[c]);
  const button = (label, attrs = "") => '<button class="btn btn-primary" ' + attrs + '>' + esc(label) + '</button>';
  const link = (url, label) => '<a class="btn btn-outline" href="' + esc(url) + '">' + esc(label) + '</a>';
  let fieldId = 0;
  const select = (name, values, label, selected = "") => {
    const id = "live-select-" + (++fieldId);
    return '<div class="live-field"><label for="' + id + '">' + esc(label) + '</label>' +
      '<select class="form-input form-select" id="' + id + '" name="' + name + '">' +
      values.map(([key, text]) => '<option value="' + esc(key) + '"' +
        (String(key) === String(selected) ? ' selected' : '') + '>' + esc(text) + '</option>').join("") + '</select></div>';
  };
  const input = (name, label, value = "", attrs = "required") => '<label>' + esc(label) +
    '<input class="form-input" name="' + name + '" value="' + esc(value) + '" ' + attrs + '></label>';
  const form = (action, body, attrs = "") => '<form class="live-form" data-action="' + action + '" ' + attrs + '>' + body + '</form>';
  const card = body => '<section class="surface-card live-card">' + body + '</section>';
  const ownLink = (slug) => 'product.html?id=' + encodeURIComponent(slug);
  const status = document.querySelector("[data-shop-status]");

  async function api(route, body) {
    const headers = {"X-Suot-Request": "shop"};
    const options = {cache:"no-store"};
    if (body) {
      options.method = "POST";
      options.headers = headers;
      if (body instanceof FormData) options.body = body;
      else {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
      }
    }
    const response = await fetch("api/" + route + ".php", options);
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(result.message || "The store service is unavailable.");
      error.alternatives = result.alternatives;
      throw error;
    }
    return result;
  }

  function message(text, alternatives = []) {
    status.textContent = text;
    for (const row of alternatives || []) {
      const a = document.createElement("a");
      a.textContent = row.name + " (" + row.size_label + ", " + row.color_name + ")";
      a.href = ownLink(row.slug);
      status.append(" ", a);
    }
  }

  let user;
  let catalog;
  let coupon = page === "checkout" ? (params.get("coupon") || "") : "";
  const fields = data => Object.fromEntries(data);
  const accountSections = {
    orders: "Orders & Tracking", returns: "Returns & Refunds", addresses: "Saved Addresses",
    profile: "Profile", notifications: "Order Emails"
  };
  const sectionLink = (key, label, selected) => '<a class="catalog-dock-tab' +
    (selected ? ' active' : '') + '" href="account.html?section=' + key + '"' +
    (selected ? ' aria-current="page"' : '') + '>' + esc(label) + '</a>';

  async function signOut() {
    const response = await fetch("api/account.php", {
      method:"POST", headers:{"Content-Type":"application/json","X-Suot-Request":"account"},
      body:JSON.stringify({action:"logout"})
    });
    if (!response.ok) throw new Error("Could not sign out. Please try again.");
    location.assign("auth.html");
  }

  function bindSignOut(id) {
    const control = document.getElementById(id);
    control.hidden = false;
    control.onclick = () => signOut().catch(error => message(error.message));
  }
  const heading = title => '<h1>' + esc(title) + '</h1>';
  function needSignIn() {
    if (page === "checkout") {
      root.innerHTML = `          <section class="surface-card" id="checkout-auth-gate" style="max-width:680px;margin:var(--space-8) auto;text-align:center;padding:var(--space-8);">
            <span class="pill pill-lagoon" style="margin-bottom:var(--space-3);">Sign In Required for Checkout</span>
            <h2 style="margin-top:0;font-size:var(--text-2xl);">Sign In or Create an Account to Continue</h2>
            <p style="color:var(--text-secondary);max-width:50ch;margin:var(--space-2) auto var(--space-6);">
              Browse our coastal catalog first or sign in with your Suot Isla account to start island dispatch checkout.
            </p>
            <div style="display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap;">
              <a href="auth.html?redirect=checkout.html" class="btn btn-primary btn-lg btn-pill">Sign In to Existing Account →</a>
              <a href="auth.html?redirect=checkout.html&mode=register" class="btn btn-coral btn-lg btn-pill">Create Customer Account →</a>
              <a href="cart.html" class="btn btn-outline btn-lg btn-pill">← Back to Bag</a>
            </div>
          </section>`;
      return;
    }
    const destination = page + ".html";
    root.innerHTML = card(heading("Sign in to continue") + '<div class="live-actions">' +
      link("auth.html?redirect=" + destination, "Sign in") +
      link("auth.html?redirect=" + destination + "&mode=register", "Create an account") + '</div>');
  }

  function image(row) {
    return row.image_url && /^assets\/images\/[a-zA-Z0-9_./-]+$/.test(row.image_url)
      ? '<img class="live-product-image" src="' + esc(row.image_url) + '" alt="' + esc(row.name) + '">' : "";
  }

  async function browse() {
    catalog ||= (await api("catalog")).variants;
    const selectedSeries = params.get("series") || "all";
    document.querySelectorAll("[data-quick-series]").forEach(tab => {
      const series = tab.dataset.quickSeries;
      tab.classList.toggle("active", series === selectedSeries);
      tab.setAttribute("aria-selected", String(series === selectedSeries));
      tab.onclick = () => {
        const next = new URLSearchParams(params);
        if (series === "all") next.delete("series"); else next.set("series", series);
        location.search = next.toString();
      };
    });
    const choices = key => [["","All"], ...[...new Set(catalog.map(r => r[key]))].map(x => [x,x])];
    const filter = form("filter",
      input("q", "Search", params.get("q") || "", "") +
      select("category", [["","All"], ...[...new Set(catalog.map(r => r.category))].map(x => [x,x])], "Category", params.get("category") || "") +
      select("series", [["","All"], ...[...new Set(catalog.map(r => r.series))].map(x => [x,x])], "Island series", params.get("series") || "") +
      select("size", choices("size_label"), "Size", params.get("size") || "") +
      select("color", choices("color_name"), "Color", params.get("color") || "") +
      input("max_price","Maximum price",params.get("max_price") || "",'type="number" min="0" step=".01"') +
      select("sort", [["","Featured"],["asc","Lowest price"],["desc","Highest price"],["name","Name: A to Z"]], "Sort", params.get("sort") || "") + button("Apply"));
    const term = (params.get("q") || "").trim().toLowerCase();
    const matches = catalog.filter(r => (!params.get("category") || r.category === params.get("category")) &&
      (!params.get("series") || r.series === params.get("series")) &&
      (!params.get("size") || r.size_label === params.get("size")) &&
      (!params.get("color") || r.color_name === params.get("color")) &&
      (!params.get("max_price") || Number(r.unit_price) <= Number(params.get("max_price"))) &&
      (r.name + " " + r.description + " " + r.color_name).toLowerCase().includes(term));
    const grouped = new Map();
    for (const r of matches) {
      if (!grouped.has(r.slug) || +r.unit_price < +grouped.get(r.slug).unit_price) grouped.set(r.slug, r);
    }
    let rows = [...grouped.values()];
    if (params.get("sort")) {
      rows.sort((a,b) => params.get("sort") === "name" ? a.name.localeCompare(b.name) : (a.unit_price - b.unit_price) * (params.get("sort") === "desc" ? -1 : 1));
    }
    root.innerHTML = '<details class="surface-card live-card catalog-live-refine"' + (params.size > 0 ? ' open' : '') +
      '><summary>Search and refine</summary>' + filter + '<a href="catalog.html">Clear filters</a></details>' +
      '<p class="catalog-results-meta">Showing ' + rows.length + ' of ' + new Set(catalog.map(row => row.slug)).size + ' products</p>' +
      '<div class="product-grid">' + rows.map(productCard).join("") + '</div>' +
      (rows.length ? "" : "<p>No matching products.</p>");
  }

  function productCard(row) {
    const url = ownLink(row.slug);
    return '<article class="product-card live-catalog-card"><a href="' + url + '">' + image(row) + '</a>' +
      '<div class="live-product-copy"><span class="pill pill-lagoon">' + esc(row.series) + '</span>' +
      '<h2><a href="' + url + '">' + esc(row.name) + '</a></h2><p>From ' + money(row.unit_price) + '</p>' +
      link(url, "View product") + '</div></article>';
  }

  async function product() {
    catalog ||= (await api("catalog")).variants;
    const rows = catalog.filter(r => r.slug === params.get("id"));
    if (!rows.length) { root.innerHTML = heading("Product unavailable") + link("catalog.html","Browse catalog"); return; }
    const row = rows[0];
    const preferred = rows.find(r => r.color_name === params.get("color") && Number(r.stock_qty) > 0);
    const purchasable = rows.filter(r => Number(r.stock_qty) > 0);
    const addLimit = (preferred || purchasable[0])?.stock_qty || 1;
    const breadcrumbSeries = document.getElementById("pdp-breadcrumb-series");
    breadcrumbSeries.textContent = row.series;
    breadcrumbSeries.href = "catalog.html?series=" + encodeURIComponent(row.series);
    document.getElementById("pdp-breadcrumb-name").textContent = row.name;
    const related = [...new Map(catalog.filter(r => r.series === row.series && r.slug !== row.slug)
      .map(r => [r.slug, r])).values()].slice(0,3);
    root.innerHTML = '<div class="pdp-grid live-pdp"><div>' + image(row) + '</div><div class="surface-card live-card">' +
      '<span class="pill pill-lagoon">' + esc(row.series) + '</span>' + heading(row.name) +
      '<p>' + money((preferred || row).unit_price) + '</p><p>' + esc(row.description) + '</p>' +
      (user?.role === "customer" ? form("add", select("variant_id", rows.filter(r => +r.stock_qty > 0).map(r =>
        [r.variant_id, r.size_label + " / " + r.color_name + " · " + money(r.unit_price) + " · " + r.stock_qty + " available"]), "Size and color", preferred?.variant_id) +
        input("quantity","Quantity",1,'type="number" min="1" max="' + Number(addLimit) + '" required') +
        button("Add to cart", rows.some(r => +r.stock_qty > 0) ? "" : "disabled")) :
        link("auth.html","Sign in to shop")) + '</div></div>' +
      (related.length ? '<section class="section-block"><div class="section-head"><h2>Complete Your Island Kit</h2></div>' +
        '<div class="product-grid pdp-related-grid">' + related.map(productCard).join("") + '</div></section>' : "");
    const variant = root.querySelector('[name="variant_id"]');
    const quantity = root.querySelector('[name="quantity"]');
    if (variant && quantity) {
      variant.addEventListener("change", () => {
        const stock = Number(purchasable.find(r => String(r.variant_id) === variant.value)?.stock_qty || 1);
        quantity.max = stock;
        quantity.value = Math.min(Number(quantity.value) || 1, stock);
      });
    }
  }

  async function cart() {
    root.dataset.activeCoupon = coupon;
    const {items} = await api("checkout");
    const cartPage = cart;
    const rows = items.map(row => ({
      productId:row.slug, name:esc(row.name), size:esc(row.size_label), color:esc(row.color_name),
      series:esc(window.SuotStore.getProductById(row.slug)?.series || "Island"),
      price:Number(row.unit_price), qty:Number(row.quantity), stock:Number(row.stock_qty), variant:Number(row.variant_id)
    }));
    let summary, validationError;
    if (items.length) {
      try { summary = (await api("checkout",{action:"validate",coupon})).totals; }
      catch(error) { validationError = error; }
    }
    const totals = {subtotal:summary?.subtotal,deliveryFee:summary?.delivery_fee,discount:summary?.discount,total:summary?.total,
      itemCount:rows.reduce((s,i)=>s+i.qty,0),coupon:coupon ? {code:esc(coupon),label:"Applied"} : null};
        if (!rows.length) {
          root.innerHTML = `
            <div class="surface-card" style="grid-column:1 / -1;text-align:center;padding:var(--space-12);">
              <h2 style="margin-top:0;">Your Shopping Bag is Currently Empty</h2>
              <p style="margin:var(--space-2) auto var(--space-6);">
                Add boardshorts, resort linen, beach throws, or dry bags from our 16-item catalog.
              </p>
              <a href="catalog.html" class="btn btn-primary btn-lg">Explore the 16-Product Catalog</a>
            </div>
          `;
          return;
        }

        root.innerHTML = `
          <section class="surface-card" aria-label="Shopping Cart Items">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">
              <h2 style="margin:0;font-size:var(--text-xl);">Selected Gear (${totals.itemCount} Item/s)</h2>
              <button type="button" class="btn btn-ghost btn-sm" id="clear-entire-bag-btn" style="color:var(--color-coral-deep);">
                Clear Bag
              </button>
            </div>

            ${window.SuotUI.renderShippingMeterHTML(totals.subtotal)}

            <div style="overflow-x:auto;">
              <table class="cart-table">
                <thead>
                  <tr>
                    <th>Product &amp; Variant</th>
                    <th>Unit Price</th>
                    <th>Quantity</th>
                    <th>Line Subtotal</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows
                    .map((item, idx) => {
                      const prod = window.SuotStore.getProductById(item.productId);
                      return `
                        <tr>
                          <td class="cart-item-cell" data-label="Product">
                            <div style="display:flex;align-items:center;gap:var(--space-3);">
                              <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" style="width:56px;height:70px;background:var(--color-sand);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);overflow:hidden;display:block;flex-shrink:0;">
                                ${prod ? window.SuotStore.renderProductVisual(prod, item.color) : ""}
                              </a>
                              <div>
                                <span class="pill pill-lagoon" style="margin-bottom:4px;">${item.series} Series</span>
                                <div style="font-weight:700;">
                                  <a href="product.html?id=${encodeURIComponent(item.productId)}&color=${encodeURIComponent(item.color)}" style="text-decoration:none;color:var(--text-primary);">${item.name}</a>
                                </div>
                                <div style="font-size:var(--text-xs);color:var(--text-muted);display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                                  <span>Size: <strong>${item.size}</strong> ·</span>
                                  <span class="inline-color-dot" style="background-color:${window.SuotStore.getColorHex(item.color)};"></span>
                                  <span>Color: <strong>${item.color}</strong></span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="price" data-label="Unit Price">${window.SuotStore.formatPrice(item.price)}</td>
                          <td data-label="Quantity">
                            <div class="qty-stepper">
                              <button type="button" data-page-dec="${idx}">−</button>
                              <input type="number" value="${item.qty}" min="1" max="${Number(item.stock)}" readonly aria-label="Quantity for ${item.name}" />
                              <button type="button" data-page-inc="${idx}" ${item.qty>=item.stock ? "disabled" : ""}>+</button>
                            </div>
                          </td>
                          <td class="price" style="font-weight:700;" data-label="Line Subtotal">${window.SuotStore.formatPrice(item.price * item.qty)}</td>
                          <td class="cart-remove-cell" data-label="Action">
                            <button type="button" class="btn btn-outline btn-sm" data-page-rem="${idx}" style="color:var(--color-coral-deep);">
                              Remove
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:var(--space-3);margin-top:var(--space-6);">
              <a href="catalog.html" class="btn btn-outline">← Continue Shopping</a>
              <span style="font-size:var(--text-xs);color:var(--text-muted);">
                Free Philippine island shipping automatically unlocks at ₱3,500+
              </span>
            </div>
          </section>

          <aside class="surface-card" aria-label="Order Totals and Coupon">
            <h2 style="margin-top:0;font-size:var(--text-xl);margin-bottom:var(--space-4);">Order Summary</h2>

            <!-- Coupon Application Form (Use Case: Apply Coupon <<extend>> Checkout) -->
            <form id="coupon-form" style="margin-bottom:var(--space-5);padding-bottom:var(--space-5);border-bottom:1px solid var(--border-subtle);">
              <label for="coupon-code-input" class="form-label" style="display:block;margin-bottom:6px;">
                Promo / Coupon Code
              </label>
              <div style="display:flex;gap:var(--space-2);">
                <input
                  type="text"
                  id="coupon-code-input"
                  name="coupon_code"
                  class="form-input mono"
                  placeholder="ISLA10, SURF15, or FREESHIP"
                  value="${totals.coupon ? totals.coupon.code : ""}"
                />
                <button type="submit" class="btn btn-outline">Apply</button>
              </div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;">
                <button type="button" class="pill pill-sand" style="border:none;cursor:pointer;" data-fill-coupon="ISLA10">ISLA10 (10% Off)</button>
                <button type="button" class="pill pill-sand" style="border:none;cursor:pointer;" data-fill-coupon="SURF15">SURF15 (15% Off ₱2.5k+)</button>
                <button type="button" class="pill pill-sand" style="border:none;cursor:pointer;" data-fill-coupon="FREESHIP">FREESHIP</button>
              </div>
              ${
                totals.coupon
                  ? `<div style="margin-top:8px;font-size:var(--text-xs);color:var(--color-palm);display:flex;justify-content:space-between;align-items:center;">
                      <span>✓ Active: <strong>${totals.coupon.code}</strong> (${totals.coupon.label})</span>
                      <button type="button" id="remove-coupon-btn" style="background:none;border:none;color:var(--color-coral-deep);cursor:pointer;font-weight:700;">Remove</button>
                    </div>`
                  : ""
              }
            </form>

            <div class="summary-row">
              <span>Items Subtotal (${totals.itemCount})</span>
              <strong class="price">${window.SuotStore.formatPrice(totals.subtotal)}</strong>
            </div>

            <div class="summary-row">
              <span>Philippine Island Delivery Fee</span>
              <strong class="price">${totals.deliveryFee === 0 ? "FREE (₱0)" : window.SuotStore.formatPrice(totals.deliveryFee)}</strong>
            </div>

            ${
              totals.discount > 0
                ? `<div class="summary-row" style="color:var(--color-palm);">
                    <span>Coupon Discount (${totals.coupon.code})</span>
                    <strong class="price">−${window.SuotStore.formatPrice(totals.discount)}</strong>
                  </div>`
                : ""
            }

            <div class="summary-row total">
              <span>Grand Total</span>
              <span class="price price-pulse" id="cart-grand-total">${window.SuotStore.formatPrice(totals.total)}</span>
            </div>

            <div id="cart-stock-guard-slot"></div>

            <a href="checkout.html?coupon=${encodeURIComponent(coupon)}" id="cart-checkout-cta" class="btn btn-primary btn-lg btn-block" style="margin-top:var(--space-5);">
              Proceed to Structured Checkout →
            </a>
          </aside>
        `;


    if (validationError) {
      root.querySelector("#cart-checkout-cta").remove();
      root.querySelector("#cart-stock-guard-slot").textContent = validationError.message;
      root.querySelectorAll(".summary-row, .shipping-meter").forEach(el=>el.hidden=true);
      message(validationError.message,validationError.alternatives);
    }
    async function change(fn) {
      root.inert = true;
      try { await fn(); await cartPage(); window.dispatchEvent(new Event("suotisla:bag-update")); }
      catch(error) { message(error.message,error.alternatives); }
      finally { root.inert = false; }
    }
    const update = (i,quantity) => api("checkout",{action:"set",variant_id:rows[i].variant,quantity});
    root.querySelectorAll("[data-page-inc],[data-page-dec],[data-page-rem]").forEach(btn=>{
      btn.onclick=()=>change(()=>{
        const i=Number(btn.dataset.pageInc ?? btn.dataset.pageDec ?? btn.dataset.pageRem);
        const quantity=btn.hasAttribute("data-page-rem") ? 0 : Math.max(1,rows[i].qty+(btn.hasAttribute("data-page-inc") ? 1 : -1));
        return update(i,quantity);
      });
    });
    root.querySelector("#clear-entire-bag-btn").onclick=()=>change(async()=>{
      for (let i=0;i<rows.length;i++) await update(i,0);
    });
    const input=root.querySelector("#coupon-code-input");
    root.querySelectorAll("[data-fill-coupon]").forEach(btn=>btn.onclick=()=>{input.value=btn.dataset.fillCoupon;});
    root.querySelector("#coupon-form").onsubmit=event=>{
      event.preventDefault();
      change(async()=>{const value=input.value.trim();await api("checkout",{action:"validate",coupon:value});coupon=value;});
    };
    const remove=root.querySelector("#remove-coupon-btn");
    if(remove) remove.onclick=()=>change(()=>{coupon="";});
  }
  function totals(t) {
    return '<dl class="live-totals"><dt>Subtotal</dt><dd>' + money(t.subtotal) +
      '</dd><dt>Delivery</dt><dd>' + money(t.delivery_fee) + '</dd><dt>Discount</dt><dd>' + money(t.discount) +
      '</dd><dt>Total</dt><dd><strong>' + money(t.total) + '</strong></dd></dl>';
  }

  function checkoutSummary({items, totals:quote}) {
    const format = window.SuotStore.formatPrice;
    return items.map(item => {
      const product = window.SuotStore.getProductById(item.slug);
      const photo = product ? window.SuotStore.renderProductVisual(product,item.color_name) : "";
      return `<div class="receipt-item-row" style="padding:8px;border-bottom:1px solid var(--border-subtle);">
        <div class="receipt-item-thumb">${photo}</div>
        <div><strong>${Number(item.quantity)}× ${esc(item.name)}</strong>
          <div class="receipt-item-spec">${esc(item.size_label)} · ${esc(item.color_name)}</div></div>
        <strong class="price">${format(Number(item.unit_price)*Number(item.quantity))}</strong>
      </div>`;
    }).join("") + `
      <div class="summary-row"><span>Subtotal (${items.reduce((n,item)=>n+Number(item.quantity),0)} items)</span><strong>${format(quote.subtotal)}</strong></div>
      <div class="summary-row"><span>Island Courier Fee</span><strong>${Number(quote.delivery_fee) ? format(quote.delivery_fee) : "FREE"}</strong></div>
      ${Number(quote.discount)>0 ? `<div class="summary-row"><span>Discount (${esc(coupon)})</span><strong>−${format(quote.discount)}</strong></div>` : ""}
      <div class="summary-row total"><span>Total Due</span><strong class="price">${format(quote.total)}</strong></div>`;
  }

  function checkoutAddress(address) {
    return ["street_address","barangay","city","province","postal_code"].map(field=>esc(address[field])).filter(Boolean).join(", ");
  }

  function reviewCheckout(address, quote) {
    const dialog = document.getElementById("checkout-payment-modal");
    const cod = address.payment_method === "COD";
    dialog.querySelector("#chk-pay-modal-eyebrow").textContent = cod ? "Island Express COD Desk" : "GCash Payment";
    dialog.querySelector("#chk-pay-modal-title").textContent = cod ? "Confirm Cash on Delivery Order" : "Confirm GCash Order";
    dialog.querySelector("#chk-pay-modal-body").innerHTML = `
      <div style="background:var(--color-sand);padding:12px 14px;border-radius:var(--radius-sm);font-size:var(--text-xs);margin-bottom:14px;">
        <div style="margin-bottom:6px;"><strong>Recipient:</strong> ${esc(address.full_name)} (${esc(address.phone)})</div>
        <div style="margin-bottom:6px;color:var(--text-muted);"><strong>Delivery Address:</strong> ${checkoutAddress(address)}</div>
        <div class="summary-row"><strong>${cod ? "Cash Due Upon Delivery" : "Order Total"}</strong><strong class="price">${window.SuotStore.formatPrice(quote.total)}</strong></div>
      </div>
      <p style="font-size:var(--text-xs);color:var(--text-muted);margin-bottom:14px;">
        ${cod ? "Confirming reserves warehouse stock. Payment remains Pending until the courier collects cash." : "This places your order with a pending GCash payment."}
      </p>
      <form method="dialog" style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="btn btn-outline" id="chk-pay-cancel-btn" value="back" autofocus>Back</button>
        <button class="btn btn-primary" id="chk-pay-confirm-btn" value="confirm">${cod ? "Confirm Cash on Delivery Order" : "Place GCash Order"} →</button>
      </form>`;
    dialog.querySelector("#chk-pay-modal-close").onclick = () => dialog.close();
    dialog.returnValue = "";
    return new Promise(resolve => {
      dialog.addEventListener("close",() => resolve(dialog.returnValue === "confirm"),{once:true});
      dialog.showModal();
    });
  }

  async function checkout() {
    root.dataset.activeCoupon = coupon;
    const [summary,data] = await Promise.all([api("checkout",{action:"validate",coupon}),api("customer-data")]);
    root.innerHTML = '<div class="split-checkout-grid">'+document.getElementById("checkout-layout").innerHTML+
      '<aside class="surface-card" id="checkout-summary-panel"><h2>Checkout Summary</h2><div data-totals>'+checkoutSummary(summary)+'</div>'+
      form("coupon",input("coupon","Promo code",coupon,"")+button("Apply"))+'</aside></div>';
    const checkoutForm=root.querySelector("#checkout-form");
    const inputs=checkoutForm.elements;
    inputs.full_name.value=user.name;
    inputs.email.value=user.email;
    const preset=root.querySelector("#chk-preset-addr");
    preset.add(new Option("Enter delivery address",""));
    data.addresses.forEach((a,i)=>preset.add(new Option(a.street_address+", "+a.city,i)));
    function useAddress(a) {
      inputs.full_name.value=a?.recipient_name || user.name;
      inputs.phone.value=a?.phone || data.profile.phone || "";
      for(const field of ["street_address","barangay","city","province","postal_code"]) inputs[field].value=a?.[field] || "";
    }
    if(data.addresses.length) preset.value="0";
    useAddress(data.addresses[0]);
    preset.onchange=()=>useAddress(preset.value==="" ? null : data.addresses[Number(preset.value)]);
    function choose(method) {
      inputs.payment_method.value=method;
      root.querySelector("#checkout-submit-btn").textContent = method === "COD" ? "Review & Confirm COD Order →" : "Review GCash Order →";
      inputs.payer_mobile.disabled=method!=="GCash";
      root.querySelector("#payment-details-box").hidden=inputs.payer_mobile.disabled;
      root.querySelectorAll("[data-pay-method]").forEach(btn=>{btn.classList.toggle("active",btn.dataset.payMethod===method);});
    }
    root.querySelectorAll("[data-pay-method]").forEach(btn=>btn.onclick=()=>choose(btn.dataset.payMethod));
    choose("COD");
  }

  async function showCheckoutConfirmation(result, address) {
    const number = esc(result.order_number);
    const orderLink = "account.html?order="+encodeURIComponent(result.order_number);
    const name = esc(address.full_name || user.name);
    const firstName = esc((address.full_name || user.name).trim().split(/\s+/)[0]);
    const destination = checkoutAddress(address);
    const payment = esc(address.payment_method);
    const paymentStatus = esc(result.payment_status);
    const payChip = payment === "COD" ? "Cash on Delivery · Pending Courier Collection" : "GCash · "+paymentStatus;
    root.classList.add("checkout-confirm-grid");
    document.getElementById("checkout-head-title").textContent = "Order Confirmed & E-Receipt Ready";
    document.getElementById("checkout-head-desc").textContent = "Your island dispatch is queued. Track your order or save the receipt below.";
    const render = (tracking, placedAt) => {
      root.innerHTML = `          <article class="confirm-dispatch-card is-cascading" aria-label="Order Confirmation and Dispatch Status">
            <div class="confirm-hero-banner">
              <div class="confirm-hero-top">
                <span class="pill pill-delivery">✓ Order Received</span>
                <span class="mono" style="font-size:0.72rem;color:rgba(250,246,238,0.82);">${placedAt}</span>
              </div>
              <h2>Salamat, <em>${firstName}!</em></h2>
              <p class="confirm-hero-sub">
                Your Suot Isla gear is reserved. Check Order Emails and Your Orders for updates.
              </p>
              <div class="confirm-hero-chips">
                <span class="confirm-ref-chip">Order #${number}</span>
                <span class="confirm-ref-chip">Tracking: ${tracking}</span>
                <span class="confirm-ref-chip">${payChip}</span>
              </div>
            </div>

            <div class="confirm-dispatch-body">
              <div class="confirm-milestone-strip" aria-label="Dispatch Progress">
                <div class="confirm-milestone-step is-done">
                  <span>✓ Done</span>
                  <strong>Confirmed</strong>
                  <span>Stock reserved</span>
                </div>
                <div class="confirm-milestone-step">
                  <span>02 · Next</span>
                  <strong>Manila Hub</strong>
                  <span>Quality pack</span>
                </div>
                <div class="confirm-milestone-step">
                  <span>03</span>
                  <strong>Island Express</strong>
                  <span>Sea &amp; air port</span>
                </div>
                <div class="confirm-milestone-step">
                  <span>04</span>
                  <strong>Doorstep</strong>
                  <span>2–5 days est.</span>
                </div>
              </div>

              <div class="confirm-info-grid">
                <div class="confirm-info-box">
                  <span class="confirm-info-label">Shipping Destination</span>
                  <strong>${name}</strong>
                  <div style="color:var(--text-muted);margin-top:2px;line-height:1.45;">
                    ${destination}
                  </div>
                </div>
                <div class="confirm-info-box">
                  <span class="confirm-info-label">Payment &amp; Tracking</span>
                  <strong>${payment} (${paymentStatus})</strong>
                  <div class="mono" style="font-size:0.72rem;color:var(--text-muted);margin-top:4px;">
                    Waybill: ${tracking}
                  </div>
                </div>
              </div>

              <div class="confirm-cta-row">
                <a href="${orderLink}" class="btn btn-primary btn-pill">
                  Track Order &amp; Manage Returns →
                </a>
                <a href="${orderLink}&amp;receipt=1" class="btn btn-coral btn-pill">View E-Receipt</a>
                <button type="button" class="btn btn-outline btn-pill" id="view-conf-email-btn">Order Emails</button>
                <a href="catalog.html" class="btn btn-outline btn-pill">
                  Continue Shopping
                </a>
              </div>
            </div>
          </article>

          <div id="checkout-receipt-mount" class="is-cascading" style="animation-delay:75ms;"></div>
`;
      root.querySelector("#checkout-receipt-mount").innerHTML = '<section class="surface-card live-card"><h2>Order Summary</h2>'+totals(result.totals)+'</section>';
      root.querySelector("#view-conf-email-btn").onclick = () => window.SuotUI.openDrawer("email");
    };
    render("Pending", "");
    window.dispatchEvent(new Event("suotisla:bag-update"));
    window.scrollTo(0, 0);
    try {
      const [{orders},{items}] = await Promise.all([api("orders"),api("account-items")]);
      const order = orders.find(row=>row.order_number===result.order_number);
      if (order) {
        root.querySelector(".confirm-hero-top .mono").textContent = order.placed_at;
        root.querySelector(".confirm-ref-chip:nth-child(2)").textContent = "Tracking: "+order.tracking_number;
        root.querySelector(".confirm-info-box:nth-child(2) .mono").textContent = "Waybill: "+order.tracking_number;
        window.SuotUI.renderReceiptSheet({
          orderNumber:number,trackingNumber:esc(order.tracking_number),placedAt:esc(order.placed_at),
          customerName:name,customerEmail:esc(user.email),customerPhone:esc(address.phone),shippingAddress:esc(order.shipping_address_snapshot),
          paymentMethod:payment,paymentStatus:esc(order.payment_status),status:esc(order.order_status),
          subtotal:order.subtotal,deliveryFee:order.delivery_fee,discount:order.discount_amount,total:order.total_amount,
          items:items.filter(item=>Number(item.order_id)===Number(order.order_id)).map(item=>({
            productId:item.slug,name:esc(item.product_name_snapshot),size:esc(item.size_snapshot),color:esc(item.color_snapshot),
            qty:Number(item.quantity),price:Number(item.unit_price),
            image:/^assets\/images\/[a-zA-Z0-9_.\/-]+$/.test(item.image_url) ? item.image_url : ""
          }))
        },root.querySelector("#checkout-receipt-mount"));
      }
    } catch { /* The completed order remains available via Your Orders. */ }
  }

  function orderCommand(order, action, label, extra = "") {
    return form("orders", '<input type="hidden" name="action" value="' + action +
      '"><input type="hidden" name="order_id" value="' + Number(order.order_id) + '">' + extra + button(label));
  }

  function orderInfo(order) {
    return '<div class="live-order-head"><h2>' + esc(order.order_number) + '</h2><span class="pill pill-lagoon">' +
      esc(order.order_status) + '</span></div><p>' + esc(order.placed_at) + ' · ' +
      money(order.total_amount) + '</p><p>' + esc(order.payment_method) + ' · ' + esc(order.payment_status) +
      '</p><p>Tracking ' + esc(order.tracking_number) + ' · ' + esc(order.delivery_status.replaceAll("_"," ")) + '</p>' +
      '<p>' + esc(order.shipping_address_snapshot) + '</p>';
  }

  function addressForm(address = {}) {
    return form("customer-data", '<input type="hidden" name="action" value="save_address">' +
      '<input type="hidden" name="address_id" value="' + esc(address.address_id || "") + '">' +
      input("full_name","Recipient",address.recipient_name || user.name) +
      input("phone","Mobile number",address.phone,'pattern="09[0-9]{9}" maxlength="11" required') +
      input("street_address","Street address",address.street_address) + input("barangay","Barangay",address.barangay) +
      input("city","City",address.city) + input("province","Province",address.province) +
      input("postal_code","Postal code",address.postal_code,'pattern="[0-9]{4}" maxlength="4" required') + button("Save address"));
  }

  async function account() {
    const [sales, returns, data] = await Promise.all([api("orders"),api("returns"),api("customer-data")]);
    const orderNo = (params.get("order") || "").replace(/^#/,"").toLowerCase();
    const filters = {all:"All orders", active:"In transit", delivered:"Delivered", cancelled:"Cancelled"};
    const requestedFilter = params.get("status");
    const filter = Object.hasOwn(filters, requestedFilter) ? requestedFilter : "all";
    const matchingStatus = (row, key) => key === "all" ||
      (key === "active" ? ["Packed","Out for Delivery"].includes(row.order_status) : row.order_status.toLowerCase() === key);
    const rows = sales.orders.filter(row => matchingStatus(row, filter) &&
      (!orderNo || row.order_number.toLowerCase() === orderNo || row.tracking_number.toLowerCase() === orderNo));
    const statusLinks = Object.entries(filters).map(([key,label]) => {
      const next = new URLSearchParams();
      if (key !== "all") next.set("status", key);
      if (params.get("order")) next.set("order", params.get("order"));
      const query = next.toString();
      return '<a class="featured-filter-btn' + (key === filter ? ' active' : '') +
        '" href="account.html' + (query ? '?' + esc(query) : '') + '"' + (key === filter ? ' aria-current="page"' : '') + '>' +
        esc(label) + ' (' + sales.orders.filter(row => matchingStatus(row,key)).length + ')</a>';
    }).join("");
    const requested = params.get("section");
    const selected = Object.hasOwn(accountSections, requested) ? requested : "orders";
    const nav = document.getElementById("account-workspace-tabs");
    nav.hidden = false;
    nav.innerHTML = Object.entries(accountSections).map(([key,label]) => sectionLink(key, label, key === selected)).join("");
    document.getElementById("acct-user-meta").textContent = "Signed in as " + user.name;
    document.querySelector(".account-hero-actions").hidden = false;
    document.getElementById("acct-open-emails-btn").onclick = () => location.assign("account.html?section=notifications");
    bindSignOut("acct-signout-btn");

    const ordersPanel = '<div class="orders-toolbar"><nav class="featured-filter-dock" aria-label="Order status">' + statusLinks + '</nav>' +
      form("track", '<input type="hidden" name="status" value="' + esc(filter) + '">' +
        input("order","Order or tracking number",params.get("order") || "", "") + button("Track")) + '</div>' +
      (rows.length ? "" : "<p>No matching orders in your account.</p>") +
      rows.map(order => {
        let actions = "";
        if (!["Delivered","Cancelled","Returned"].includes(order.order_status)) actions = orderCommand(order,"cancel","Cancel order");
        if (order.order_status === "Delivered" && !returns.returns.some(r => r.order_id == order.order_id && r.status !== "Rejected")) {
          actions = form("returns", '<input type="hidden" name="action" value="request"><input type="hidden" name="order_id" value="' +
            Number(order.order_id) + '">' + input("reason","Reason for return","","required maxlength=180") + button("Request return"));
        }
        return card(orderInfo(order) + actions);
      }).join("");
    const returnsPanel = '<h2>Returns, Cancellations &amp; Refunds</h2>' +
      (returns.returns.length ? '<div class="data-table-wrap"><table class="data-table"><thead><tr>' +
        '<th>Request ID</th><th>Order #</th><th>Reason</th><th>Submitted</th><th>Status</th></tr></thead><tbody>' +
        returns.returns.map(r => '<tr><td>' + esc(r.return_code) + '</td><td>' + esc(r.order_number) +
          '</td><td>' + esc(r.reason) + '</td><td>' + esc(r.requested_at) + '</td><td>' + esc(r.status) + '</td></tr>').join("") +
        '</tbody></table></div>' : "<p>No return requests.</p>");
    const profilePanel = '<h2>Profile</h2>' + card(form("customer-data", '<input type="hidden" name="action" value="profile">' +
        input("full_name","Full name",data.profile.full_name) +
        input("phone","Mobile number",data.profile.phone,'pattern="09[0-9]{9}" maxlength="11" required') + button("Save profile")));
    const addressesPanel = '<h2>Saved Philippine Delivery Addresses</h2>' + card('<details><summary>Add an address</summary>' + addressForm() + '</details>') +
      data.addresses.map(r => card('<details><summary>' + esc(r.street_address + ', ' + r.city) + '</summary>' + addressForm(r) +
        form("customer-data", '<input type="hidden" name="action" value="delete_address"><input type="hidden" name="address_id" value="' +
          Number(r.address_id) + '">' + button("Remove address")) + '</details>')).join("");
    const notificationsPanel = '<h2>Order notification history</h2>' + (data.emails.length ? data.emails.map(r => card('<strong>' + esc(r.subject) +
      '</strong><p>' + esc(r.body_preview) + '</p><p>' + (r.sent_at ? 'Sent ' + esc(r.sent_at) : 'Queued for email delivery') + '</p>')).join("") : "<p>No notifications.</p>");
    root.innerHTML = {orders:ordersPanel, returns:returnsPanel, profile:profilePanel,
      addresses:addressesPanel, notifications:notificationsPanel}[selected];
  }

  function returnCommand(r, action, label, extra = "") {
    return form("returns", '<input type="hidden" name="action" value="' + action + '"><input type="hidden" name="return_id" value="' +
      Number(r.return_id) + '">' + extra + button(label));
  }

  function table(headings,rows) {
    return '<div class="data-table-wrap"><table class="data-table"><thead><tr>'+headings.map(h=>'<th>'+esc(h)+'</th>').join("")+
      '</tr></thead><tbody>'+rows.map(cells=>'<tr>'+cells.map((c,i)=>'<td data-label="'+esc(headings[i])+'">'+c+'</td>').join("")+'</tr>').join("")+'</tbody></table></div>';
  }

  function operatorPill(status) {
    const type = ["Cancelled","Returned","Rejected","Pending Review"].includes(status) ? "coral" :
      ["Delivered","Paid","Refunded & Completed"].includes(status) ? "delivery" : "lagoon";
    return '<span class="pill pill-'+type+'">'+esc(status)+'</span>';
  }

  function operatorItems(order) {
    return (order?.items || []).map(item => {
      const product = window.SuotStore.getProductById(item.slug);
      const photo = product ? window.SuotStore.renderProductVisual(product,item.color_snapshot) : "";
      return '<div class="operator-item"><span class="operator-item-thumb">'+photo+'</span><span><strong>'+
        Number(item.quantity)+'× '+esc(item.product_name_snapshot)+'</strong><br>'+esc(item.size_snapshot)+' · '+esc(item.color_snapshot)+'</span></div>';
    }).join("") || '—';
  }

  function operatorReceipt(order) {
    window.SuotUI.openReceiptModal({
      orderNumber:esc(order.order_number),trackingNumber:esc(order.tracking_number),placedAt:esc(order.placed_at),
      customerName:esc(order.customer_name),customerEmail:"",shippingAddress:esc(order.shipping_address_snapshot),
      paymentMethod:esc(order.payment_method),paymentStatus:esc(order.payment_status),status:esc(order.order_status),
      subtotal:order.subtotal,deliveryFee:order.delivery_fee,discount:order.discount_amount,total:order.total_amount,
      items:(order.items || []).map(item => ({
        productId:item.slug,name:esc(item.product_name_snapshot),size:esc(item.size_snapshot),color:esc(item.color_snapshot),
        qty:Number(item.quantity),price:Number(item.unit_price),
        image:/^assets\/images\/[a-zA-Z0-9_.\/-]+$/.test(item.image_url) ? item.image_url : ""
      }))
    });
  }

  async function operations() {
    if (!["staff","admin","courier"].includes(user?.role)) {
      root.innerHTML=document.getElementById("operator-login").innerHTML;
      const form=root.querySelector("#admin-login-form");
      const toggle=root.querySelector("#admin-pass-toggle");
      toggle.onclick=()=>{const pw=form.elements.password;pw.type=pw.type==="password"?"text":"password";toggle.textContent=pw.type==="text"?"Hide":"Show";};
      form.onsubmit=async event=>{
        event.preventDefault();
        const btn=form.querySelector("button[type=submit]");btn.disabled=true;
        try {
          const response=await fetch("api/auth-login.php",{method:"POST",headers:{"Content-Type":"application/json","X-Suot-Request":"account"},
            body:JSON.stringify(Object.fromEntries(new FormData(form)))});
          const result=await response.json();
          if(!response.ok || !["admin","staff","courier"].includes(result.user?.role)) throw new Error(result.message || "An operator account is required.");
          location.reload();
        } catch(error) {message(error.message);}
        finally {btn.disabled=false;}
      };
      return;
    }
    const staff = user.role !== "courier";
    const tabs = [...document.querySelectorAll("[data-console-tab]")];
    const available = tabs.filter(element => element.dataset.adminRoles.split(",").includes(user.role));
    const tab = available.some(element => element.dataset.consoleTab === params.get("tab")) ? params.get("tab") : (staff ? "report" : "dispatch");
    available.forEach(element => {
      element.hidden = false;
      element.classList.toggle("active", element.dataset.consoleTab === tab);
      if (element.dataset.consoleTab === tab) element.setAttribute("aria-current","page");
      else element.removeAttribute("aria-current");
    });
    document.querySelector(".admin-sidebar").hidden = false;
    const role = document.getElementById("topbar-role-badge");
    document.getElementById("console-role-label").textContent = user.role;
    role.textContent = user.role.toUpperCase();
    role.hidden = false;
    bindSignOut("admin-signout-btn");
    const outbox = document.getElementById("admin-open-emails-btn");
    outbox.hidden = !staff;
    outbox.onclick = staff ? () => window.SuotUI.openDrawer("email") : null;

    const tabTitles={orders:"Order Fulfillment & Status Pipeline",dispatch:"Courier Dispatch Board",report:"Store Analytics & Operations Command",
      products:"Catalog & Inventory Control",team:"Team & Customer Access Control",returns:"Refund & Return Processing (2-Stage Verification)"};
    const descriptions = {
      report:"Review sales, warehouse stock, and orders that need attention.",
      products:"Filter low-stock items, preview color variants, and manage product availability.",
      orders:"Review order items, assign couriers, and open receipts.",
      dispatch:"Track assigned deliveries and update their dispatch status.",
      returns:"Review returns and record refunds after payout.",
      team:"View registered members and assign store team permissions."
    };
    root.innerHTML = '<div class="admin-header-bar"><div>'+heading(tabTitles[tab])+
      '<p class="operator-description">'+descriptions[tab]+'</p></div></div><div data-workspace></div>';
    const panel = root.querySelector("[data-workspace]");
    if (staff && tab === "report") {
      const [report,sales,claims] = await Promise.all([api("analytics"),api("orders"),api("returns")]);
      const queue=sales.orders.filter(row=>["Pending","Confirmed"].includes(row.order_status)).length;
      const due=claims.returns.filter(row=>["Pending Review","Approved · Awaiting Refund"].includes(row.status)).length;
      const tiles=[["Collected Revenue",money(report.totals.revenue),"orders"],["Awaiting Pack & Dispatch",queue,"orders"],
        ["Low-Stock Alerts",report.low_stock.length,"products"],["Returns & Payouts Queue",due,"returns"]];
      panel.previousElementSibling.insertAdjacentHTML("beforeend",'<a href="admin.html?tab=products&amp;new=1" class="btn btn-primary btn-pill btn-sm">+ Add Product</a>');
      const highest=Math.max(1,...report.series.map(row=>Number(row.merchandise_revenue)));
      panel.innerHTML='<div class="ops-attention-strip"><div class="ops-attention-head"><span class="ops-pulse-dot"></span>'+
        '<strong class="ops-attention-title">'+(queue+due+report.low_stock.length)+' operational items need attention</strong></div>'+
        '<div class="ops-attention-pills"><a class="ops-action-chip" href="admin.html?tab=orders&amp;filter=needs-action">Awaiting Pack &amp; Dispatch <span class="ops-action-count">'+queue+'</span></a>'+
        '<a class="ops-action-chip" href="admin.html?tab=products&amp;filter=low">Critical Stock <span class="ops-action-count">'+report.low_stock.length+'</span></a>'+
        '<a class="ops-action-chip" href="admin.html?tab=returns">Returns &amp; Refunds Due <span class="ops-action-count">'+due+'</span></a></div></div>'+
        '<div class="ops-summary-grid">'+tiles.map(([title,value,to])=>'<a class="ops-tile is-interactive" href="admin.html?tab='+to+'">'+
          '<div class="ops-tile-top"><span class="ops-tile-title">'+esc(title)+'</span></div><div class="ops-tile-value">'+esc(value)+'</div></a>').join("")+'</div>'+
        '<div class="split-checkout-grid"><section class="surface-card"><h2>Revenue by Philippine Island Series</h2>'+
        '<div class="series-bar-list">'+report.series.map(row=>'<div class="series-bar-item"><div class="series-bar-top"><strong>'+esc(row.name)+'</strong>'+
          '<span class="price">'+money(row.merchandise_revenue)+'</span></div><div class="series-bar-track"><div class="series-bar-fill" style="width:'+
          Math.round(Number(row.merchandise_revenue)*100/highest)+'%"></div></div></div>').join("")+'</div>'+
        '<h3>Top 5 best-selling products</h3>'+table(["Product","Units sold"],report.top_products.map(r=>[esc(r.name),Number(r.units_sold)]))+'</section>'+
        '<aside class="surface-card"><h2>Low-stock alerts</h2>'+table(["Product","Variant","Stock"],report.low_stock.map(r=>[esc(r.name),esc(r.variant_sku),Number(r.stock_qty)]))+
        '<p>Collected COD '+money(report.totals.collected_cod)+' · Pending COD '+money(report.totals.pending_cod)+'</p><p>'+esc(report.funnel.summary)+'</p></aside></div>';
      return;
    }
    if (staff && tab === "returns") {
      const [claims,sales] = await Promise.all([api("returns"),api("orders")]);
      const orderById = new Map(sales.orders.map(order => [Number(order.order_id),order]));
      const priority = status => status === "Pending Review" ? 0 : status.includes("Awaiting Refund") ? 1 : 2;
      claims.returns.sort((a,b) => priority(a.status) - priority(b.status));
      panel.innerHTML = table(["Return ID","Order # & Customer","Request Type & Reason","Item & Refund Amount","Stock & Payout Verification","Status","2-Stage Decision"],claims.returns.map(r => {
        const order = orderById.get(Number(r.order_id));
        const decision = r.status === "Pending Review" ? returnCommand(r,"approve","Approve") + returnCommand(r,"reject","Reject") :
          r.status === "Approved · Awaiting Refund" ? returnCommand(r,"confirm_refund","Record refund",
            select("refund_channel",[["GCash","GCash"],["Cash","Cash"]],"Refund channel") +
            input("refund_reference","Refund reference","","required minlength=6 maxlength=80")) : "—";
        return ['<strong class="mono">'+esc(r.return_code)+'</strong><p>'+esc(r.requested_at)+'</p>','<strong>'+esc(r.order_number)+'</strong><p>'+esc(order?.customer_name)+'</p>',
          '<span class="pill pill-sand">'+esc(r.request_type)+'</span><p>'+esc(r.reason)+'</p>',operatorItems(order)+(order ? '<p class="price">'+money(order.total_amount)+'</p>' : ""),
          (Number(r.is_restocked) ? "Restocked" : "Awaiting restock")+'<p>'+esc(r.refund_reference || "")+'</p>',
          operatorPill(r.status),decision];
      })) + (claims.returns.length ? "" : "<p>No return requests.</p>");
      return;
    }
    if (staff && tab === "products") { await inventory(panel); return; }
    if (user.role === "admin" && tab === "team") {
      const {users} = await api("admin-team");
      panel.innerHTML = table(["Account ID","Member & Email","Mobile & Joined","Storefront Activity","Current Role","Assign Permission"],users.map(member => {
        const initials = member.full_name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join("");
        const identity = '<div class="operator-member"><span class="auth-avatar-badge">'+esc(initials)+'</span><div><strong>'+esc(member.full_name)+'</strong><br>'+esc(member.email)+'</div></div>';
        const permissions = user.email === member.email ? "Your account" : form("admin-team",
          '<input type="hidden" name="user_id" value="'+Number(member.user_id)+'">'+
          select("role",["customer","staff","courier","admin"].map(role=>[role,role]),"Role",member.role)+button("Save role"));
        return ['<span class="mono">#USR-'+Number(member.user_id)+'</span>',identity,
          esc(member.phone || "—")+'<p>Joined '+esc(member.created_at?.slice(0,10) || "—")+'</p>',
          Number(member.orders_placed || 0)+' orders placed',operatorPill(member.role.toUpperCase()),permissions];
      }));
      return;
    }
    const [{orders}, team] = await Promise.all([api("orders"), staff ? api("admin-team") : {couriers:[]}]);
    const dispatch = tab === "dispatch";
    const displayedOrders = dispatch ? orders.filter(order => ["Packed", "Out for Delivery", "Delivered"].includes(order.order_status)) : orders;
    const orderActions = order => {
      let actions = "";
      if (staff && ["Pending","Confirmed"].includes(order.order_status)) {
        if (order.payment_method === "GCash" && order.payment_status === "Pending") actions += orderCommand(order,"confirm_mock_gcash","Confirm mock GCash");
        else actions += orderCommand(order,"advance",order.order_status === "Pending" ? "Confirm order" : "Pack order");
      }
      if (staff && order.order_status === "Packed" && team.couriers.length) {
        actions += orderCommand(order,"assign_courier","Assign courier",
          select("courier_user_id",team.couriers.map(r => [r.user_id,r.full_name]),"Courier",order.courier_user_id));
      }
      if (!staff && order.order_status === "Packed") actions += orderCommand(order,"dispatch","Dispatch order");
      if (!staff && order.order_status === "Out for Delivery") {
        actions += orderCommand(order,"deliver","Confirm delivery",order.payment_method === "COD" ?
          '<label><input type="checkbox" name="collected" required> Cash collected</label>' : "");
      }
      if (staff && !["Delivered","Cancelled","Returned"].includes(order.order_status)) actions += orderCommand(order,"cancel","Cancel order");
      return actions+'<button type="button" class="btn btn-outline btn-sm btn-pill" data-operator-receipt="'+Number(order.order_id)+'">Receipt</button>';
    };
    if (dispatch) {
      const badge = document.createElement("span");
      badge.className = "pill pill-delivery";
      badge.textContent = staff ? "Courier Dispatch" : "Active Courier: "+user.name;
      panel.previousElementSibling.append(badge);
      panel.innerHTML = displayedOrders.map(order =>
        '<article class="surface-card dispatch-record"><div><div class="operator-dispatch-pills"><strong class="mono">#'+esc(order.order_number)+
        '</strong>'+operatorPill(order.tracking_number)+operatorPill(order.order_status)+'</div><strong>'+esc(order.customer_name)+
        '</strong><p>Drop-off: '+esc(order.shipping_address_snapshot)+'</p><div class="operator-dispatch-items">'+operatorItems(order)+
        '</div></div><div>'+orderActions(order)+'</div></article>').join("") || "<p>No orders to show.</p>";
    } else {
      const filters = [["all","All orders"],["needs-action","Needs action"],["transit","In transit"],["delivered","Delivered"],["cancelled","Cancelled"]];
      const statuses = {"needs-action":["Pending","Confirmed","Packed"],transit:["Out for Delivery"],delivered:["Delivered"],cancelled:["Cancelled","Returned"]};
      const matches = (order,key) => key === "all" || statuses[key]?.includes(order.order_status);
      let filter = statuses[params.get("filter")] ? params.get("filter") : "all";
      panel.innerHTML = '<div class="admin-toolbar-row"><div class="featured-filter-dock" id="admin-orders-dock">'+filters.map(([id,label])=>
        '<button type="button" class="featured-filter-btn" data-admin-ord-filter="'+id+'">'+label+' <span class="featured-filter-count">('+
        displayedOrders.filter(order=>matches(order,id)).length+')</span></button>').join("")+
        '</div><input type="search" id="admin-orders-search" class="admin-search-input" placeholder="Search order #, customer, city..." aria-label="Search orders"></div><div data-operator-orders></div>';
      const search = panel.querySelector("#admin-orders-search");
      search.value = params.get("search") || "";
      function drawOrders() {
        const q = search.value.trim().toLowerCase();
        const results = displayedOrders.filter(order=>matches(order,filter)&&
          [order.order_number,order.customer_name,order.tracking_number,order.shipping_address_snapshot].some(value=>String(value||"").toLowerCase().includes(q)));
        panel.querySelectorAll("[data-admin-ord-filter]").forEach(control=>{
          const active = control.dataset.adminOrdFilter===filter;
          control.classList.toggle("active",active);
          control.setAttribute("aria-pressed",active);
        });
        panel.querySelector("[data-operator-orders]").innerHTML = results.length ? table(
          ["Order # & Date","Customer & Destination","Items","Total & Payment","Courier & Tracking","Status","Update & Receipt"],results.map(order=>[
            '<strong class="mono">#'+esc(order.order_number)+'</strong><p>'+esc(order.placed_at)+'</p>',
            '<strong>'+esc(order.customer_name)+'</strong><p>'+esc(order.shipping_address_snapshot)+'</p>',operatorItems(order),
            '<strong class="price">'+money(order.total_amount)+'</strong><p>'+esc(order.payment_method)+' · '+esc(order.payment_status)+'</p>',
            esc(order.courier_name || "Awaiting assignment")+'<br><span class="mono">'+esc(order.tracking_number)+'</span>',
            operatorPill(order.order_status),orderActions(order)
          ])) : "<p>No orders to show.</p>";
        enhanceSelects();
      }
      panel.querySelectorAll("[data-admin-ord-filter]").forEach(control=>control.onclick=()=>{filter=control.dataset.adminOrdFilter;drawOrders();});
      search.oninput=drawOrders;
      drawOrders();
    }
    panel.addEventListener("click",event=>{
      const control=event.target.closest("[data-operator-receipt]");
      if (!control) return;
      const order=displayedOrders.find(row=>Number(row.order_id)===Number(control.dataset.operatorReceipt));
      if (order) operatorReceipt(order);
    });
  }

  async function inventory(panel) {
    const data = await api("admin-products");
    const categories = data.categories.map(r => [r.category_id,r.name]);
    const series = data.series.map(r => [r.series_id,r.name]);
    const groups = new Map();
    for (const p of data.products) {
      if (!groups.has(p.product_id)) groups.set(p.product_id,[]);
      groups.get(p.product_id).push(p);
    }
    function productForm(p = {}) {
      return form("admin-products", '<input type="hidden" name="action" value="' + (p.product_id ? "edit" : "create") + '">' +
        (p.product_id ? '<input type="hidden" name="product_id" value="' + Number(p.product_id) + '">' : "") +
        input("sku","Product SKU",p.sku) + input("slug","URL slug",p.slug) + input("name","Name",p.name) +
        input("description","Description",p.description) + input("price","Price",p.base_price,'type="number" min="0" step=".01" required') +
        select("category_id",categories,"Category",p.category_id) + select("series_id",series,"Island series",p.series_id) +
        input("image","Product photo","","type=file accept=image/jpeg,image/png,image/webp") +
        '<details' + (p.product_id ? "" : " open") + '><summary>Add a size/color variant</summary>' +
        input("variant_sku","Variant SKU","","") + input("size_label","Size","","") + input("color_name","Color","","") +
        input("stock_qty","Starting stock",0,'type="number" min="0"') + '</details>' + button(p.product_id ? "Save changes" : "Create product"),
        'enctype="multipart/form-data"');
    }
    const inventoryCommand = (action, idField, id, label, extra = "") => form("admin-products",
      '<input type="hidden" name="action" value="' + action + '"><input type="hidden" name="' + idField + '" value="' +
      Number(id) + '">' + extra + button(label));
    const archiveCommand = (action, field, id, archived, entity) =>
      inventoryCommand(action, field, id, (+archived ? "Restore " : "Archive ") + entity,
        '<input type="hidden" name="archived" value="' + (+archived ? 0 : 1) + '">');
    const categoryForm = (row = {}) => form("admin-products",
      '<input type="hidden" name="action" value="save_category"><input type="hidden" name="category_id" value="' + esc(row.category_id || "") + '">' +
      input("name","Category name",row.name) + input("slug","Category slug",row.slug) + button(row.category_id ? "Save category" : "Add category"));
    const products = [...groups.values()];
    const seriesNames = new Map(series);
    const categoryNames = new Map(categories);
    const stock = group => group.reduce((total,v) => total + (Number(v.variant_archived) ? 0 : Number(v.stock_qty)),0);
    const filters = [["all","All SKUs"],["low","Critical Stock"],...series];
    const matches = (group,key) => key === "all" || (key === "low" ? !Number(group[0].is_archived) && stock(group)<=5 : String(group[0].series_id)===String(key));
    const toolbar = '<div class="admin-toolbar-row"><div class="featured-filter-dock" id="admin-inv-dock">'+filters.map(([id,label]) =>
      '<button type="button" class="featured-filter-btn" data-inv-filter="'+esc(id)+'">'+esc(label)+' <span class="featured-filter-count">('+products.filter(g=>matches(g,id)).length+')</span></button>').join("")+
      '</div><input type="search" class="admin-search-input" id="admin-inv-search" placeholder="Search SKU or product..." aria-label="Search inventory products"></div>';
    panel.innerHTML = toolbar+'<div data-inventory-rows></div><details class="surface-card"><summary>Manage categories</summary>'+categoryForm()+
      data.categories.map(row=>categoryForm(row)+archiveCommand("toggle_category","category_id",row.category_id,row.is_archived,"category")).join("")+'</details>'+
      '<dialog class="modal-dialog inventory-editor"><div class="modal-header"><h2></h2><button type="button" class="btn btn-ghost btn-sm" aria-label="Close">✕</button></div><div class="modal-body"></div></dialog>';
    const dialog = panel.querySelector("dialog");
    const add = document.createElement("button");
    add.className = "btn btn-primary btn-pill";
    add.textContent = "+ Add Product";
    panel.previousElementSibling.append(add);
    function editor(group) {
      const p = group?.[0];
      dialog.querySelector("h2").textContent = p ? p.name : "Add Product";
      dialog.querySelector(".modal-body").innerHTML = p ? (productForm(p) + (p.image_url ? inventoryCommand("remove_image","product_id",p.product_id,"Remove photo") : "") +
          form("admin-products", '<input type="hidden" name="product_id" value="' + Number(p.product_id) + '"><input type="hidden" name="action" value="' +
            (Number(p.is_archived) ? "restore" : "archive") + '">' + button(Number(p.is_archived) ? "Restore" : "Archive")) +
          group.filter(r => r.variant_id).map(r => '<p>' + esc(r.size_label) + ' / ' + esc(r.color_name) + ' · ' + Number(r.stock_qty) + ' in stock' +
            (+r.stock_qty <= 5 ? ' · Low stock' : '') + '</p>' +
            form("admin-products", '<input type="hidden" name="action" value="restock"><input type="hidden" name="variant_id" value="' +
              Number(r.variant_id) + '">' + input("quantity","Add stock",1,'type="number" min="1" required') + button("Restock")) +
            form("admin-products", '<input type="hidden" name="action" value="edit_variant"><input type="hidden" name="variant_id" value="' +
              Number(r.variant_id) + '">' + input("size_label","Size",r.size_label) + input("color_name","Color",r.color_name) +
              input("stock_qty","Stock on hand",r.stock_qty,'type="number" min="0" max="100000" required') + button("Save variant")) +
            archiveCommand("toggle_variant","variant_id",r.variant_id,r.variant_archived,"variant")).join("")) : productForm();
      dialog.showModal();
    }
    add.onclick = () => editor(null);
    dialog.querySelector(".modal-header button").onclick = () => dialog.close();
    let filter = params.get("filter")==="low" ? "low" : "all";
    const search = panel.querySelector("#admin-inv-search");
    function drawInventory() {
      const q = search.value.trim().toLowerCase();
      const list = products.filter(group => matches(group,filter) && group.some(v => [v.name,v.sku,v.variant_sku].some(value => String(value||"").toLowerCase().includes(q))));
      panel.querySelectorAll("[data-inv-filter]").forEach(b => {const active=b.dataset.invFilter===filter; b.classList.toggle("active",active); b.setAttribute("aria-pressed",active);});
      panel.querySelector("[data-inventory-rows]").innerHTML = table(["Preview","SKU & Product Name","Series & Category","Variants & Color Preview","Price","Stock Control","Actions"],list.map(group => {
        const p = group[0];
        const colors = [...new Set(group.map(v=>v.color_name).filter(Boolean))];
        const sizes = [...new Set(group.map(v=>v.size_label).filter(Boolean))];
        const units = stock(group);
        return ['<div class="inv-thumb">'+image(p)+'</div>','<span class="mono">'+esc(p.sku)+'</span><p><strong>'+esc(p.name)+'</strong></p>'+
          (Number(p.is_archived) ? '<span class="pill pill-sand">Archived</span>' : units<=5 ? '<span class="pill pill-coral">LOW STOCK</span>' : ""),
          '<span class="pill pill-lagoon">'+esc(seriesNames.get(p.series_id))+'</span><p>'+esc(categoryNames.get(p.category_id))+'</p>',
          esc(sizes.join(", "))+'<p>'+esc(colors.join(" · "))+'</p>',money(p.base_price),units+" units",
          '<button class="btn btn-outline btn-sm" type="button" data-edit-product="'+Number(p.product_id)+'">Edit / Restock</button>'];
      }))+(list.length ? "" : "<p>No matching products.</p>");
    }
    panel.addEventListener("click",event => {
      const f=event.target.closest("[data-inv-filter]");
      if (f) {filter=f.dataset.invFilter;drawInventory();}
      const editButton=event.target.closest("[data-edit-product]");
      if(editButton) editor(products.find(g=>Number(g[0].product_id)===Number(editButton.dataset.editProduct)));
    });
    search.addEventListener("input",drawInventory);
    drawInventory();
    if (params.get("new")==="1") {
      params.delete("new");
      history.replaceState(null,"","admin.html?"+params.toString());
      editor(null);
    }
  }

  const changePrompts = {
    cancel: "Cancel this order and return its items to inventory?",
    approve: "Approve this return and update inventory?",
    reject: "Reject this return request?",
    confirm_refund: "Record the refund with this channel and reference?",
    archive: "Archive this product and hide it from the storefront?",
    restore: "Restore this product to the storefront?",
    remove_image: "Remove this product photo?"
  };

  function confirmOperationsChange(formData) {
    const action = formData.action;
    if (page !== "admin" || !Object.hasOwn(changePrompts, action)) return true;
    const dialog = document.getElementById("operations-confirm");
    if (dialog.open) return false;
    document.getElementById("operations-confirm-message").textContent = changePrompts[action];
    dialog.returnValue = "";
    return new Promise(resolve => {
      dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), {once:true});
      dialog.showModal();
    });
  }

  const pages = {catalog:browse, product, cart, checkout, account, admin:operations};
  const enhanceSelects = () => window.SuotUI?.enhanceSelects(root);
  let checkoutInProgress = false;
  root.addEventListener("submit", async event => {
    const formElement = event.target.closest("form[data-action]");
    if (!formElement) return;
    event.preventDefault();
    const action = formElement.dataset.action;
    if (action === "checkout" && checkoutInProgress) return;
    if (action === "checkout") checkoutInProgress = true;
    const submitter = event.submitter;
    if (submitter) submitter.disabled = true;
    const data = new FormData(formElement);
    const body = fields(data);
    message("");
    try {
      if (!await confirmOperationsChange(body)) return;
      if (action === "filter" || action === "track") {
        location.search = new URLSearchParams(body).toString();
        return;
      }
      if (action === "add" || action === "set") {
        await api("checkout", {...body, action, quantity:submitter?.name === "remove" ? 0 : body.quantity});
        if (page === "cart") {
          await cart();
          enhanceSelects();
        }
        message(action === "add" ? "Added to your shopping bag." : "Shopping bag updated.");
      } else if (action === "coupon") {
        const result = await api("checkout", {action:"validate",coupon:body.coupon});
        coupon = body.coupon;
        root.dataset.activeCoupon = coupon;
        root.querySelector("[data-totals]").innerHTML = checkoutSummary(result);
        message("Totals updated.");
      } else if (action === "checkout") {
        const quote = await api("checkout",{action:"validate",coupon});
        if (!await reviewCheckout(body,quote.totals)) return;
        const r = await api("checkout", {...body,action,coupon});
        await showCheckoutConfirmation(r,body);
      } else {
        if (body.collected === "on") body.collected = true;
        await api(action, formElement.enctype === "multipart/form-data" ? data : body);
        await pages[page]();
        enhanceSelects();
        message("Saved.");
      }
    } catch (error) {
      message(error.message, error.alternatives);
      status.scrollIntoView({block:"nearest"});
    } finally {
      if (action === "checkout") checkoutInProgress = false;
      if (submitter) submitter.disabled = false;
    }
  });
  window.addEventListener("suotisla:bag-update", async event => {
    if (event.detail?.source !== "drawer") return;
    try {
      if (page === "cart") await cart();
      if (page === "checkout" && root.querySelector("[data-totals]")) {
        const quote = await api("checkout",{action:"validate",coupon});
        root.querySelector("[data-totals]").innerHTML = checkoutSummary(quote);
      }
    } catch(error) { message(error.message,error.alternatives); }
  });
  (async () => {
    try {
      user = (await api("account")).user;
      if (["cart","checkout","account"].includes(page) && user?.role !== "customer") needSignIn();
      else await pages[page]();
      enhanceSelects();
    } catch (error) {
      root.replaceChildren();
      message(error.message, error.alternatives);
    } finally {
      root.removeAttribute("aria-busy");
    }
  })();
})();
