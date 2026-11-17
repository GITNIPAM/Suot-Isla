/* ==========================================================================
   Suot Isla — Unified Coastal Catalog Controller (catalog.js)
   Matches index.html lookbook aesthetic with dynamic 6-facet filtering.
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

  const params = new URLSearchParams(window.location.search);
  if (params.get("series")) state.series = params.get("series");
  if (params.get("category")) state.category = params.get("category");
  if (params.get("q")) state.search = params.get("q");

  const heroImgEl = document.getElementById("catalog-hero-img");
  const heroEyebrowEl = document.getElementById("catalog-hero-eyebrow");
  const heroTitleEl = document.getElementById("catalog-hero-title");
  const heroDescEl = document.getElementById("catalog-hero-desc");
  const allBackLinkEl = document.getElementById("catalog-all-back-link");

  const searchInput = document.getElementById("filter-search");
  const categoryDockEl = document.getElementById("catalog-category-dock");
  const sizeGridEl = document.getElementById("filter-size-grid");
  const colorSwatchesEl = document.getElementById("filter-color-swatches");
  const colorFilterLabelEl = document.getElementById("color-filter-label");
  const priceInputEl = document.getElementById("filter-price");
  const priceLabelEl = document.getElementById("price-range-label");
  const sortSelectEl = document.getElementById("catalog-sort");
  const resetBtn = document.getElementById("reset-filters-btn");
  const gridEl = document.getElementById("catalog-product-grid");
  const countLabelEl = document.getElementById("catalog-count-label");
  const taglineEl = document.getElementById("catalog-series-tagline");
  const activeFiltersBar = document.getElementById("active-filters-bar");
  const refineBtn = document.getElementById("toggle-refine-tray");
  const refineTray = document.getElementById("catalog-refine-tray");
  const refineBadge = document.getElementById("refine-active-badge");

  if (searchInput && state.search) searchInput.value = state.search;

  function withTransition(fn) {
    if (typeof document.startViewTransition === "function") {
      try {
        const vt = document.startViewTransition(fn);
        if (vt && vt.finished) vt.finished.catch(() => {});
        if (vt && vt.ready) vt.ready.catch(() => {});
        return;
      } catch (_) {}
    }
    fn();
  }

  function syncUrlSeries() {
    const url = new URL(window.location.href);
    if (state.series === "all") {
      url.searchParams.delete("series");
    } else {
      url.searchParams.set("series", state.series);
    }
    window.history.replaceState({}, "", url.toString());
    window.dispatchEvent(new Event("suotisla:statechange"));
  }

  function updateCatalogHero() {
    if (!heroImgEl || !heroEyebrowEl || !heroTitleEl || !heroDescEl) return;

    if (allBackLinkEl) {
      allBackLinkEl.style.display = state.series === "all" ? "none" : "inline-flex";
    }

    if (state.series === "all") {
      heroImgEl.src = "assets/images/hero-surf.jpg";
      heroImgEl.alt = "Suot Isla coastal surf & resort apparel capsule";
      heroEyebrowEl.textContent = "ISLAND ARCHIVE • 4 CAPSULES • 16 PIECES";
      heroTitleEl.innerHTML = `Island Apparel. <em>Built for Salt Water.</em>`;
      heroDescEl.textContent =
        "Salt-tested boardshorts, golden-hour Boracay linen, and reef-safe essentials crafted for Philippine waters.";
      return;
    }

    const sInfo = window.SUOT_ISLA_DATA.islandSeries.find((s) => s.id === state.series);
    if (sInfo) {
      heroImgEl.src = sInfo.image;
      heroImgEl.alt = `${sInfo.name} coastal editorial lookbook`;
      heroEyebrowEl.textContent = `${sInfo.coords} • ${sInfo.swellTag.toUpperCase()}`;
      heroTitleEl.innerHTML = `${sInfo.id} <em>Series.</em>`;
      heroDescEl.textContent = `${sInfo.subtitle}. ${sInfo.description}`;
    }
  }

  function buildFilterControls() {
    const products = window.SuotStore.getProducts();
    const seriesScoped =
      state.series === "all" ? products : products.filter((p) => p.series === state.series);

    // 1. Category Coastal Pill Dock (counts scoped to active island series)
    const catCounts = { all: seriesScoped.length };
    window.SUOT_ISLA_DATA.categories.forEach((c) => {
      catCounts[c] = seriesScoped.filter((p) => p.category === c).length;
    });

    const catLabels = {
      all: "All Categories",
      "Swim & Surf": "Swim & Surf",
      "Resort & Loungewear": "Resort & Linen",
      "Beach Towels & Ponchos": "Towels & Ponchos",
      "Island Accessories": "Accessories"
    };

    const catOptions = ["all", ...window.SUOT_ISLA_DATA.categories];
    categoryDockEl.innerHTML = catOptions
      .map((cat) => {
        const cnt = catCounts[cat] || 0;
        const isDisabled = cat !== "all" && cnt === 0;
        return `
        <button
          type="button"
          class="featured-filter-btn ${state.category === cat ? "active" : ""}"
          data-cat-pill="${cat}"
          role="tab"
          aria-selected="${state.category === cat ? "true" : "false"}"
          ${isDisabled ? "disabled" : ""}
        >
          <span>${catLabels[cat] || cat}</span>
          <span class="featured-filter-count">(${cnt})</span>
        </button>
      `;
      })
      .join("");

    categoryDockEl.querySelectorAll("[data-cat-pill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.category = btn.getAttribute("data-cat-pill");
        withTransition(() => {
          buildFilterControls();
          renderCatalog();
        });
      });
    });

    // 2. Size Pills (matching inline product card pills)
    const allSizes = [];
    products.forEach((p) => {
      (p.sizes || []).forEach((sz) => {
        if (!allSizes.includes(sz)) allSizes.push(sz);
      });
    });

    sizeGridEl.innerHTML = [
      `<button type="button" class="card-size-pill ${state.size === "all" ? "active" : ""}" data-size-filter="all">All</button>`,
      ...allSizes.map(
        (sz) =>
          `<button type="button" class="card-size-pill ${state.size === sz ? "active" : ""}" data-size-filter="${sz}">${sz}</button>`
      )
    ].join("");

    sizeGridEl.querySelectorAll("[data-size-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.size = btn.getAttribute("data-size-filter");
        buildFilterControls();
        renderCatalog();
      });
    });

    // 3. Visual Colorway Swatch Dots
    const allColors = [];
    products.forEach((p) => {
      (p.colors || []).forEach((c) => {
        if (!allColors.includes(c)) allColors.push(c);
      });
    });
    allColors.sort();

    if (colorFilterLabelEl) {
      colorFilterLabelEl.textContent = state.color === "all" ? `All (${allColors.length})` : state.color;
    }

    colorSwatchesEl.innerHTML = [
      `<button type="button" class="card-size-pill ${state.color === "all" ? "active" : ""}" data-color-filter="all">All</button>`,
      ...allColors.map(
        (c) => `
        <button
          type="button"
          class="color-filter-dot ${state.color === c ? "active" : ""}"
          style="background-color:${window.SuotStore.getColorHex(c)};"
          title="${c}"
          aria-label="Filter by ${c}"
          data-color-filter="${c}"
        ></button>
      `
      )
    ].join("");

    colorSwatchesEl.querySelectorAll("[data-color-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.color = btn.getAttribute("data-color-filter");
        buildFilterControls();
        renderCatalog();
      });
    });

    // 4. Sync Refine Badge Count
    let refineCount = 0;
    if (state.size !== "all") refineCount++;
    if (state.color !== "all") refineCount++;
    if (Number(state.maxPrice) < 2600) refineCount++;
    if (refineBadge) {
      refineBadge.style.display = refineCount > 0 ? "inline-flex" : "none";
      refineBadge.textContent = String(refineCount);
    }

    // 5. Sync Hero Frosted Island Dock
    document.querySelectorAll("[data-quick-series]").forEach((btn) => {
      const val = btn.getAttribute("data-quick-series");
      btn.classList.toggle("active", val === state.series);
    });

    updateCatalogHero();
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

    countLabelEl.textContent = `Showing ${filtered.length} of ${allProducts.length} pieces`;

    if (state.series !== "all") {
      const sInfo = window.SUOT_ISLA_DATA.islandSeries.find((s) => s.id === state.series);
      taglineEl.textContent = sInfo ? `${sInfo.name} · ${sInfo.coords}` : `${state.series} Series`;
    } else {
      taglineEl.textContent = "4 Island Series · Salt-Tested Materials";
    }

    // Active filter pills
    const pills = [];
    if (state.series !== "all") pills.push({ key: "series", label: `Island: ${state.series}` });
    if (state.category !== "all") pills.push({ key: "category", label: state.category });
    if (state.size !== "all") pills.push({ key: "size", label: `Size: ${state.size}` });
    if (state.color !== "all") pills.push({ key: "color", label: state.color });
    if (state.maxPrice < 2600) pills.push({ key: "maxPrice", label: `Up to ${window.SuotStore.formatPrice(state.maxPrice)}` });
    if (state.search) pills.push({ key: "search", label: `"${state.search}"` });

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
          if (key === "series") syncUrlSeries();
        }
        buildFilterControls();
        renderCatalog();
      });
    });

    if (!filtered.length) {
      gridEl.innerHTML = `
        <div class="surface-card" style="grid-column:1 / -1;text-align:center;padding:var(--space-12);">
          <h3 style="margin-top:0;">No Island Gear Matches Those Filters</h3>
          <p style="margin:var(--space-2) auto var(--space-5);max-width:46ch;">
            Try widening your price range or clearing one of your active island, size, or colorway filters.
          </p>
          <button type="button" class="btn btn-primary btn-pill" id="empty-reset-btn">Reset All Filters</button>
        </div>
      `;
      const emptyBtn = document.getElementById("empty-reset-btn");
      if (emptyBtn) emptyBtn.addEventListener("click", resetAllFilters);
      return;
    }

    gridEl.innerHTML = filtered
      .map((p) => {
        const activeColor =
          state.selectedColorPerProduct[p.id] ||
          (state.color !== "all" && p.colors.includes(state.color) ? state.color : p.colors[0]);
        const activeSize =
          state.selectedSizePerProduct[p.id] ||
          (state.size !== "all" && p.sizes.includes(state.size) ? state.size : p.sizes[0]);
        const isLowStock = p.stock <= 5;
        const statusText = isLowStock ? `Only ${p.stock} left` : p.badge || "";

        return `
          <article class="product-card" data-product-card="${p.id}">
            <a href="product.html?id=${encodeURIComponent(p.id)}&color=${encodeURIComponent(activeColor)}" class="product-thumb-wrap">
              <div class="product-thumb-badges">
                <span class="thumb-series-pill">${p.series}</span>
                ${
                  statusText
                    ? `<span class="thumb-status-pill ${isLowStock ? "is-low-stock" : ""}">${statusText}</span>`
                    : ""
                }
              </div>
              <div class="product-svg-stage">
                ${window.SuotStore.renderProductVisual(p, activeColor)}
              </div>
              <span class="thumb-quickview-pill">View Details →</span>
            </a>

            <div class="product-body">
              <div class="product-meta-header">
                <a href="product.html?id=${encodeURIComponent(p.id)}&color=${encodeURIComponent(activeColor)}" class="product-title-link">
                  <h3>${p.name}</h3>
                </a>
                <div class="product-price">${window.SuotStore.formatPrice(p.price)}</div>
              </div>

              <div class="swatch-row" aria-label="Color Variants">
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
                <span style="font-size:var(--text-xs);color:var(--text-muted);margin-left:2px;">${activeColor}</span>
              </div>

              <div class="card-size-row" aria-label="Quick Size Selection">
                ${p.sizes
                  .map(
                    (sz) => `
                    <button
                      type="button"
                      class="card-size-pill ${sz === activeSize ? "active" : ""}"
                      data-card-size-prod="${p.id}"
                      data-card-size-val="${sz}"
                    >${sz}</button>
                  `
                  )
                  .join("")}
              </div>

              <button type="button" class="btn-minimal-add" data-card-add="${p.id}">
                Add to Bag · ${activeSize}
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    gridEl.querySelectorAll("[data-card-color-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-card-color-prod");
        const color = btn.getAttribute("data-card-color-val");
        state.selectedColorPerProduct[pid] = color;
        renderCatalog();
      });
    });

    gridEl.querySelectorAll("[data-card-size-prod]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-card-size-prod");
        const sz = btn.getAttribute("data-card-size-val");
        state.selectedSizePerProduct[pid] = sz;
        renderCatalog();
      });
    });

    gridEl.querySelectorAll("[data-card-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const pid = btn.getAttribute("data-card-add");
        const prod = window.SuotStore.getProductById(pid);
        const color =
          state.selectedColorPerProduct[pid] ||
          (state.color !== "all" && prod.colors.includes(state.color) ? state.color : prod.colors[0]);
        const size =
          state.selectedSizePerProduct[pid] ||
          (state.size !== "all" && prod.sizes.includes(state.size) ? state.size : prod.sizes[0]);
        window.SuotStore.addToCart(pid, size, color, 1);
        window.SuotUI.flashButtonAdded(btn, `✓ Added · ${size}`);
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

    syncUrlSeries();
    buildFilterControls();
    renderCatalog();
  }

  if (refineBtn && refineTray) {
    refineBtn.addEventListener("click", () => {
      const isOpen = refineTray.classList.toggle("open");
      refineBtn.classList.toggle("is-open", isOpen);
      refineBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.search = searchInput.value;
      renderCatalog();
    });
  }

  if (priceInputEl) {
    priceInputEl.addEventListener("input", () => {
      state.maxPrice = Number(priceInputEl.value);
      priceLabelEl.textContent = window.SuotStore.formatPrice(state.maxPrice);
      buildFilterControls();
      renderCatalog();
    });
  }

  if (sortSelectEl) {
    sortSelectEl.addEventListener("change", () => {
      state.sort = sortSelectEl.value;
      renderCatalog();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }

  document.querySelectorAll("[data-quick-series]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.series = btn.getAttribute("data-quick-series");
      if (state.series !== "all" && state.category !== "all") {
        const hasInCat = window.SuotStore
          .getProducts()
          .some((p) => p.series === state.series && p.category === state.category);
        if (!hasInCat) state.category = "all";
      }
      withTransition(() => {
        syncUrlSeries();
        buildFilterControls();
        renderCatalog();
      });
    });
  });

  window.addEventListener("suotisla:productschange", () => {
    if (!document.body.contains(gridEl)) return;
    buildFilterControls();
    renderCatalog();
  });

  buildFilterControls();
  renderCatalog();
});
