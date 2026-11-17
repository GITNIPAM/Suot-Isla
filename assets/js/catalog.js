/* ==========================================================================
   Suot Isla — Multi-Faceted Dynamic Catalog Controller (catalog.js)
   Supports filtering by Category, Island Series, Size, Color, Price & Search
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const state = {
    search: "",
    series: "all",
    category: "all",
    size: "all",
    color: "all",
    maxPrice: 2600,
    sort: "featured",
    selectedColorPerProduct: {},
    selectedSizePerProduct: {}
  };

  // Parse URL query parameters (?series=Siargao&category=Swim+%26+Surf&q=...)
  const params = new URLSearchParams(window.location.search);
  if (params.get("series")) state.series = params.get("series");
  if (params.get("category")) state.category = params.get("category");
  if (params.get("q")) state.search = params.get("q");

  const searchInput = document.getElementById("filter-search");
  const seriesListEl = document.getElementById("filter-series-list");
  const categoryListEl = document.getElementById("filter-category-list");
  const sizeGridEl = document.getElementById("filter-size-grid");
  const colorSelectEl = document.getElementById("filter-color");
  const priceInputEl = document.getElementById("filter-price");
  const priceLabelEl = document.getElementById("price-range-label");
  const sortSelectEl = document.getElementById("catalog-sort");
  const resetBtn = document.getElementById("reset-filters-btn");
  const gridEl = document.getElementById("catalog-product-grid");
  const countLabelEl = document.getElementById("catalog-count-label");
  const taglineEl = document.getElementById("catalog-series-tagline");
  const activeFiltersBar = document.getElementById("active-filters-bar");

  if (searchInput && state.search) searchInput.value = state.search;

  function buildFilterControls() {
    const products = window.SuotStore.getProducts();

    // 1. Island Series Radios
    const seriesCounts = { all: products.length };
    window.SUOT_ISLA_DATA.islandSeries.forEach((s) => {
      seriesCounts[s.id] = products.filter((p) => p.series === s.id).length;
    });

    const seriesOptions = [
      { id: "all", label: "All Island Series" },
      ...window.SUOT_ISLA_DATA.islandSeries.map((s) => ({ id: s.id, label: `${s.id} Series` }))
    ];

    seriesListEl.innerHTML = seriesOptions
      .map(
        (opt) => `
        <label class="filter-radio-label">
          <span>
            <input type="radio" name="series" value="${opt.id}" ${state.series === opt.id ? "checked" : ""} />
            ${opt.label}
          </span>
          <span class="mono" style="color:var(--text-muted);">${seriesCounts[opt.id] || 0}</span>
        </label>
      `
      )
      .join("");

    seriesListEl.querySelectorAll('input[name="series"]').forEach((r) => {
      r.addEventListener("change", () => {
        state.series = r.value;
        renderCatalog();
      });
    });

    // 2. Category Radios
    const catCounts = { all: products.length };
    window.SUOT_ISLA_DATA.categories.forEach((c) => {
      catCounts[c] = products.filter((p) => p.category === c).length;
    });

    const catOptions = ["all", ...window.SUOT_ISLA_DATA.categories];
    categoryListEl.innerHTML = catOptions
      .map(
        (cat) => `
        <label class="filter-radio-label">
          <span>
            <input type="radio" name="category" value="${cat}" ${state.category === cat ? "checked" : ""} />
            ${cat === "all" ? "All Categories" : cat}
          </span>
          <span class="mono" style="color:var(--text-muted);">${catCounts[cat] || 0}</span>
        </label>
      `
      )
      .join("");

    categoryListEl.querySelectorAll('input[name="category"]').forEach((r) => {
      r.addEventListener("change", () => {
        state.category = r.value;
        renderCatalog();
      });
    });

    // 3. Size Chips
    const allSizes = [];
    products.forEach((p) => {
      (p.sizes || []).forEach((sz) => {
        if (!allSizes.includes(sz)) allSizes.push(sz);
      });
    });

    sizeGridEl.innerHTML = [
      `<button type="button" class="size-chip ${state.size === "all" ? "active" : ""}" data-size-filter="all">All</button>`,
      ...allSizes.map(
        (sz) =>
          `<button type="button" class="size-chip ${state.size === sz ? "active" : ""}" data-size-filter="${sz}">${sz}</button>`
      )
    ].join("");

    sizeGridEl.querySelectorAll("[data-size-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.size = btn.getAttribute("data-size-filter");
        buildFilterControls();
        renderCatalog();
      });
    });

    // 4. Color Select
    const allColors = [];
    products.forEach((p) => {
      (p.colors || []).forEach((c) => {
        if (!allColors.includes(c)) allColors.push(c);
      });
    });
    allColors.sort();

    colorSelectEl.innerHTML = [
      `<option value="all">All Island Colorways (${allColors.length})</option>`,
      ...allColors.map(
        (c) => `<option value="${c}" ${state.color === c ? "selected" : ""}>${c}</option>`
      )
    ].join("");

    // Sync top quick-series buttons
    document.querySelectorAll("[data-quick-series]").forEach((btn) => {
      const val = btn.getAttribute("data-quick-series");
      if (val === state.series) {
        btn.classList.remove("btn-outline");
        btn.classList.add("btn-primary");
      } else {
        btn.classList.remove("btn-primary");
        btn.classList.add("btn-outline");
      }
    });
  }

  function renderCatalog() {
    const allProducts = window.SuotStore.getProducts();
    const q = state.search.trim().toLowerCase();

    let filtered = allProducts.filter((p) => {
      if (state.series !== "all" && p.series !== state.series) return false;
      if (state.category !== "all" && p.category !== state.category) return false;
      if (state.size !== "all" && !(p.sizes || []).includes(state.size)) return false;
      if (state.color !== "all" && !(p.colors || []).includes(state.color)) return false;
      if (Number(p.price) > Number(state.maxPrice)) return false;
      if (q) {
        const hay = `${p.name} ${p.description} ${p.series} ${p.category} ${p.sku} ${(p.colors || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (state.sort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (state.sort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (state.sort === "bestselling") {
      filtered.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    } else if (state.sort === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    countLabelEl.textContent = `Showing ${filtered.length} of ${allProducts.length} products`;

    if (state.series !== "all") {
      const sInfo = window.SUOT_ISLA_DATA.islandSeries.find((s) => s.id === state.series);
      taglineEl.textContent = sInfo ? `${sInfo.name} — ${sInfo.subtitle} (${sInfo.coords})` : `${state.series} Series`;
    } else {
      taglineEl.textContent = "All 4 Philippine Island Series • Live Variant Availability";
    }

    // Active filter pills
    const pills = [];
    if (state.series !== "all") pills.push({ key: "series", label: `Series: ${state.series}` });
    if (state.category !== "all") pills.push({ key: "category", label: `Category: ${state.category}` });
    if (state.size !== "all") pills.push({ key: "size", label: `Size: ${state.size}` });
    if (state.color !== "all") pills.push({ key: "color", label: `Color: ${state.color}` });
    if (state.maxPrice < 2600) pills.push({ key: "maxPrice", label: `Max: ${window.SuotStore.formatPrice(state.maxPrice)}` });
    if (state.search) pills.push({ key: "search", label: `Search: "${state.search}"` });

    activeFiltersBar.innerHTML = pills
      .map(
        (pill) => `
        <button type="button" class="pill pill-lagoon" style="border:none;cursor:pointer;" data-clear-filter="${pill.key}">
          <span>${pill.label}</span>
          <span>✕</span>
        </button>
      `
      )
      .join("");

    activeFiltersBar.querySelectorAll("[data-clear-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-clear-filter");
        if (key === "maxPrice") {
          state.maxPrice = 2600;
          priceInputEl.value = 2600;
          priceLabelEl.textContent = "₱2,600";
        } else if (key === "search") {
          state.search = "";
          searchInput.value = "";
        } else {
          state[key] = "all";
        }
        buildFilterControls();
        renderCatalog();
      });
    });

    if (!filtered.length) {
      gridEl.innerHTML = `
        <div class="surface-card" style="grid-column:1 / -1;text-align:center;padding:var(--space-12);">
          <h3 style="margin-top:0;">No Island Gear Matches Those Filters</h3>
          <p style="margin:var(--space-2) auto var(--space-5);">
            Try widening your price range or clearing one of your active size/color filters.
          </p>
          <button type="button" class="btn btn-primary" id="empty-reset-btn">Reset All Filters</button>
        </div>
      `;
      const emptyBtn = document.getElementById("empty-reset-btn");
      if (emptyBtn) emptyBtn.addEventListener("click", resetAllFilters);
      return;
    }

    gridEl.innerHTML = filtered
      .map((p) => {
        const activeColor = state.selectedColorPerProduct[p.id] || (state.color !== "all" && p.colors.includes(state.color) ? state.color : p.colors[0]);
        const activeSize = state.selectedSizePerProduct[p.id] || (state.size !== "all" && p.sizes.includes(state.size) ? state.size : p.sizes[0]);
        const isLowStock = p.stock <= 5;

        return `
          <article class="product-card">
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-thumb-wrap">
              <div class="product-badges">
                <span class="pill pill-lagoon">${p.series}</span>
                ${
                  isLowStock
                    ? `<span class="pill pill-coral">Low Stock (${p.stock} left)</span>`
                    : p.badge
                    ? `<span class="pill pill-delivery">${p.badge}</span>`
                    : ""
                }
              </div>
              <div class="product-svg-stage">
                ${window.SuotStore.renderProductVisual(p, activeColor)}
              </div>
            </a>

            <div class="product-body">
              <div class="product-meta-row">
                <span>${p.category}</span>
                <span class="mono">${p.sku}</span>
              </div>
              <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-title-link">
                <h3>${p.name}</h3>
              </a>
              <p class="product-desc">${p.description}</p>

              <!-- Color Swatch Selector -->
              <div class="swatch-row">
                ${p.colors
                  .map(
                    (c) => `
                    <button
                      type="button"
                      class="color-swatch ${c === activeColor ? "active" : ""}"
                      style="background-color:${window.SuotStore.getColorHex(c)};"
                      title="${c}"
                      data-card-color-prod="${p.id}"
                      data-card-color-val="${c}"
                    ></button>
                  `
                  )
                  .join("")}
                <span style="font-size:var(--text-xs);color:var(--text-muted);">${activeColor}</span>
              </div>

              <!-- Quick Size Selector -->
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:var(--space-3);flex-wrap:wrap;">
                <span style="font-size:var(--text-xs);color:var(--text-muted);">Size:</span>
                <select
                  class="form-select"
                  style="width:auto;padding:0.25rem 0.5rem;font-size:var(--text-xs);"
                  data-card-size-prod="${p.id}"
                  aria-label="Select Size for ${p.name}"
                >
                  ${p.sizes
                    .map((sz) => `<option value="${sz}" ${sz === activeSize ? "selected" : ""}>${sz}</option>`)
                    .join("")}
                </select>
                <span class="mono" style="margin-left:auto;color:var(--text-muted);">${p.stock} in stock</span>
              </div>

              <div class="product-card-footer">
                <span class="product-price">${window.SuotStore.formatPrice(p.price)}</span>
                <button type="button" class="btn btn-primary btn-sm" data-card-add="${p.id}">
                  Add to Bag
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join("");

    // Bind card interactions
    gridEl.querySelectorAll("[data-card-color-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-card-color-prod");
        const color = btn.getAttribute("data-card-color-val");
        state.selectedColorPerProduct[pid] = color;
        renderCatalog();
      });
    });

    gridEl.querySelectorAll("[data-card-size-prod]").forEach((sel) => {
      sel.addEventListener("change", () => {
        const pid = sel.getAttribute("data-card-size-prod");
        state.selectedSizePerProduct[pid] = sel.value;
      });
    });

    gridEl.querySelectorAll("[data-card-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-card-add");
        const prod = window.SuotStore.getProductById(pid);
        const color = state.selectedColorPerProduct[pid] || prod.colors[0];
        const size = state.selectedSizePerProduct[pid] || prod.sizes[0];
        window.SuotStore.addToCart(pid, size, color, 1);
        window.SuotUI.toast(`${prod.name} (${size}, ${color}) added to your Island Bag!`, "Bag Updated");
      });
    });
  }

  function resetAllFilters() {
    state.search = "";
    state.series = "all";
    state.category = "all";
    state.size = "all";
    state.color = "all";
    state.maxPrice = 2600;
    state.sort = "featured";
    if (searchInput) searchInput.value = "";
    if (priceInputEl) priceInputEl.value = 2600;
    if (priceLabelEl) priceLabelEl.textContent = "₱2,600";
    if (sortSelectEl) sortSelectEl.value = "featured";
    buildFilterControls();
    renderCatalog();
  }

  // Event Listeners
  searchInput.addEventListener("input", () => {
    state.search = searchInput.value;
    renderCatalog();
  });

  colorSelectEl.addEventListener("change", () => {
    state.color = colorSelectEl.value;
    renderCatalog();
  });

  priceInputEl.addEventListener("input", () => {
    state.maxPrice = Number(priceInputEl.value);
    priceLabelEl.textContent = window.SuotStore.formatPrice(state.maxPrice);
    renderCatalog();
  });

  sortSelectEl.addEventListener("change", () => {
    state.sort = sortSelectEl.value;
    renderCatalog();
  });

  resetBtn.addEventListener("click", resetAllFilters);

  document.querySelectorAll("[data-quick-series]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.series = btn.getAttribute("data-quick-series");
      buildFilterControls();
      renderCatalog();
    });
  });

  window.addEventListener("suotisla:statechange", () => {
    buildFilterControls();
    renderCatalog();
  });

  buildFilterControls();
  renderCatalog();
});
