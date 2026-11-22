/* ==========================================================================
   Suot Isla — Unified Coastal Catalog Controller (catalog.js)
   Matches index.html lookbook aesthetic with dynamic 6-facet filtering.
   ========================================================================== */

document.addEventListener("DOMContentLoaded", async () => {
  const status = document.getElementById("catalog-status");
  const stock = await window.loadIslandStock(status);
  if (!stock) return;
  const {products,customer,bag,get,safe} = stock;
  const availableCategories = new Set(products.map(product=>product.category));
  const categories = [...new Set([...window.SUOT_ISLA_DATA.categories.filter(c=>availableCategories.has(c)), ...availableCategories])];
  const priceCeiling = Math.max(2600,...products.flatMap(p=>p.variants.map(v=>Math.ceil(Number(v.unit_price)/50)*50)));
  const priceFloor = Math.min(750,...products.map(p=>Math.floor(p.price/50)*50));
  const slider = document.getElementById("filter-price");
  slider.min = priceFloor;
  slider.max = slider.value = priceCeiling;
  document.getElementById("price-range-label").textContent = window.SuotStore.formatPrice(priceCeiling);
  document.getElementById("catalog-price-limits").textContent = window.SuotStore.formatPrice(priceFloor) + " – " + window.SuotStore.formatPrice(priceCeiling);
  document.querySelector('[data-quick-series="all"] .catalog-dock-num').textContent = "(" + products.length + ")";
  const state = {
    search: "",
    series: "all",
    category: "all",
    size: "all",
    color: "all",
    maxPrice: priceCeiling,
    sort: "featured",
    selectedColorPerProduct: Object.create(null),
    selectedSizePerProduct: Object.create(null)
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

  let activeHeroSrc = heroImgEl ? heroImgEl.getAttribute("src") : "";
  let heroFadeLayer = null;
  let heroToken = 0;

  function crossfadeHeroImage(nextSrc, nextAlt) {
    if (!heroImgEl) return;
    const versionedSrc =
      window.SuotStore && window.SuotStore.withAssetVersion
        ? window.SuotStore.withAssetVersion(nextSrc)
        : nextSrc;
    if (activeHeroSrc === versionedSrc) return;
    activeHeroSrc = versionedSrc;

    const token = ++heroToken;
    const pre = new Image();
    pre.src = versionedSrc;

    const applyFade = () => {
      if (token !== heroToken || !heroImgEl.isConnected) return;
      const heroSection = heroImgEl.closest(".catalog-hero");
      if (!heroSection) {
        heroImgEl.src = versionedSrc;
        heroImgEl.alt = nextAlt;
        return;
      }
      if (heroFadeLayer && heroFadeLayer.parentNode) {
        heroFadeLayer.remove();
      }
      const nextImg = document.createElement("img");
      nextImg.src = versionedSrc;
      nextImg.alt = nextAlt;
      nextImg.className = "catalog-hero-bg catalog-hero-bg-next";
      heroImgEl.insertAdjacentElement("afterend", nextImg);
      heroFadeLayer = nextImg;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (token !== heroToken) return;
          nextImg.classList.add("is-visible");
        });
      });

      setTimeout(() => {
        if (token !== heroToken) {
          if (nextImg.parentNode) nextImg.remove();
          return;
        }
        heroImgEl.src = versionedSrc;
        heroImgEl.alt = nextAlt;
        if (nextImg.parentNode) nextImg.remove();
        if (heroFadeLayer === nextImg) heroFadeLayer = null;
      }, 500);
    };

    if (pre.complete) {
      applyFade();
    } else if (typeof pre.decode === "function") {
      pre.decode().then(applyFade, applyFade);
    } else {
      pre.onload = applyFade;
      pre.onerror = applyFade;
    }
  }

  function withTransition(fn) {
    if (window.SuotMotion && typeof window.SuotMotion.pulseTide === "function") {
      window.SuotMotion.pulseTide();
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

  function updateCatalogHero(shouldMorph = false) {
    if (!heroImgEl || !heroEyebrowEl || !heroTitleEl || !heroDescEl) return;

    if (allBackLinkEl) {
      allBackLinkEl.style.display = state.series === "all" ? "none" : "inline-flex";
    }

    let nextSrc = "assets/images/hero-surf.jpg";
    let nextAlt = "Suot Isla coastal surf & resort apparel capsule";
    let nextEyebrow = "ISLAND ARCHIVE • " + new Set(products.map(p=>p.series)).size + " CAPSULES • " + products.length + " PIECES";
    let nextTitleHtml = `Island Apparel. <em>Built for Salt Water.</em>`;
    let nextDesc =
      "Salt-tested boardshorts, golden-hour Boracay linen, and reef-safe essentials crafted for Philippine waters.";

    if (state.series !== "all") {
      const sInfo = window.SUOT_ISLA_DATA.islandSeries.find((s) => s.id === state.series);
      if (sInfo) {
        nextSrc = sInfo.image;
        nextAlt = `${sInfo.name} coastal editorial lookbook`;
        nextEyebrow = `${sInfo.coords} • ${sInfo.swellTag.toUpperCase()}`;
        nextTitleHtml = `${sInfo.id} <em>Series.</em>`;
        nextDesc = `${sInfo.subtitle}. ${sInfo.description}`;
      }
    }

    const textChanged = heroEyebrowEl.textContent !== nextEyebrow;
    heroEyebrowEl.textContent = nextEyebrow;
    heroTitleEl.innerHTML = nextTitleHtml;
    heroDescEl.textContent = nextDesc;

    if (shouldMorph && textChanged) {
      const heroCopyTop = heroTitleEl.closest(".catalog-hero-top");
      if (heroCopyTop) {
        heroCopyTop.classList.remove("is-morphing");
        void heroCopyTop.offsetWidth;
        heroCopyTop.classList.add("is-morphing");
      }
    }

    crossfadeHeroImage(nextSrc, nextAlt);
  }

  function buildFilterControls(shouldMorph = false) {

    const seriesScoped =
      state.series === "all" ? products : products.filter((p) => p.series === state.series);

    // 1. Category Coastal Pill Dock (counts scoped to active island series)
    const catCounts = { all: seriesScoped.length };
    categories.forEach((c) => {
      catCounts[c] = seriesScoped.filter((p) => p.category === c).length;
    });

    const catLabels = {
      all: "All Categories",
      "Swim & Surf": "Swim & Surf",
      "Resort & Loungewear": "Resort & Linen",
      "Beach Towels & Ponchos": "Towels & Ponchos",
      "Island Accessories": "Accessories"
    };

    const catOptions = ["all", ...categories];
    categoryDockEl.innerHTML = catOptions
      .map((cat) => {
        const cnt = catCounts[cat] || 0;
        const isDisabled = cat !== "all" && cnt === 0;
        return `
        <button
          type="button"
          class="featured-filter-btn ${state.category === cat ? "active" : ""}"
          data-cat-pill="${safe(cat)}"
          role="tab"
          aria-selected="${state.category === cat ? "true" : "false"}"
          ${isDisabled ? "disabled" : ""}
        >
          <span>${safe(catLabels[cat] || cat)}</span>
          <span class="featured-filter-count">(${cnt})</span>
        </button>
      `;
      })
      .join("");

    categoryDockEl.querySelectorAll("[data-cat-pill]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextCat = btn.getAttribute("data-cat-pill");
        if (nextCat === state.category) return;
        state.category = nextCat;
        withTransition(() => {
          buildFilterControls(false);
          renderCatalog(true);
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
          `<button type="button" class="card-size-pill ${state.size === sz ? "active" : ""}" data-size-filter="${safe(sz)}">${safe(sz)}</button>`
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
          style="background-color:${safe(window.SuotStore.getColorHex(c))};"
          title="${safe(c)}"
          aria-label="Filter by ${safe(c)}"
          data-color-filter="${safe(c)}"
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
    if (Number(state.maxPrice) < priceCeiling) refineCount++;
    if (refineBadge) {
      refineBadge.style.display = refineCount > 0 ? "inline-flex" : "none";
      refineBadge.textContent = String(refineCount);
    }

    // 5. Sync Hero Frosted Island Dock
    document.querySelectorAll("[data-quick-series]").forEach((btn) => {
      const val = btn.getAttribute("data-quick-series");
      const isActive = val === state.series;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    updateCatalogHero(shouldMorph);
  }

  function renderCatalog(cascade = false) {
    const allProducts = products;
    const q = state.search.trim().toLowerCase();

    let filtered = allProducts.filter((p) => {
      if (state.series !== "all" && p.series !== state.series) return false;
      if (state.category !== "all" && p.category !== state.category) return false;
      if (state.size !== "all" && !(p.sizes || []).includes(state.size)) return false;
      if (state.color !== "all" && !(p.colors || []).includes(state.color)) return false;
      if (Number(p.price) > Number(state.maxPrice)) return false;
      if (q) {
        const hay = `${safe(p.name)} ${p.description} ${safe(p.series)} ${p.category} ${p.sku} ${(p.colors || []).join(" ")}`.toLowerCase();
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
    if (state.maxPrice < priceCeiling) pills.push({ key: "maxPrice", label: `Up to ${window.SuotStore.formatPrice(state.maxPrice)}` });
    if (state.search) pills.push({ key: "search", label: `"${state.search}"` });

    activeFiltersBar.innerHTML = pills
      .map(
        (pill) => `
        <button type="button" class="pill pill-lagoon" style="border:none;cursor:pointer;" data-clear-filter="${pill.key}">
          <span>${safe(pill.label)}</span>
          <span>✕</span>
        </button>
      `
      )
      .join("");

    activeFiltersBar.querySelectorAll("[data-clear-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-clear-filter");
        if (key === "maxPrice") {
          state.maxPrice = priceCeiling;
          priceInputEl.value = priceCeiling;
          priceLabelEl.textContent = window.SuotStore.formatPrice(priceCeiling);
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
      .map((p, idx) => {
        const activeColor =
          state.selectedColorPerProduct[p.id] ||
          (state.color !== "all" && p.colors.includes(state.color) ? state.color : p.colors[0]);
        const activeSize =
          state.selectedSizePerProduct[p.id] ||
          (state.size !== "all" && p.sizes.includes(state.size) ? state.size : p.sizes[0]);
        const variant = p.variants.find(row=>row.size_label === activeSize && row.color_name === activeColor);
        const avail = Number(variant?.stock_qty || 0);
        const inBag = bag.get(Number(variant?.variant_id)) || 0;
        const rem = Math.max(0, avail - inBag);
        const isOutOfStock = avail <= 0;
        const isLowStock = avail > 0 && avail <= 5;
        const statusText = isOutOfStock ? "Sold Out" : isLowStock ? `Only ${avail} left` : p.badge || "";
        const cascadeClass = cascade ? " is-cascading" : "";
        const cascadeStyle = cascade ? ` style="animation-delay:${Math.min(idx * 26, 208)}ms;"` : "";

        return `
          <article class="product-card${cascadeClass}"${cascadeStyle} data-product-card="${safe(p.id)}">
            <a href="product.html?id=${encodeURIComponent(p.id)}&color=${encodeURIComponent(activeColor)}" class="product-thumb-wrap">
              <div class="product-thumb-badges">
                <span class="thumb-series-pill">${safe(p.series)}</span>
                ${
                  statusText
                    ? `<span class="thumb-status-pill ${isOutOfStock || isLowStock ? "is-low-stock" : ""}">${statusText}</span>`
                    : ""
                }
              </div>
              <div class="product-svg-stage">
                ${window.SuotStore.renderProductVisual({...p, name:safe(p.name)}, safe(activeColor))}
              </div>
              <span class="thumb-quickview-pill">View Details →</span>
            </a>

            <div class="product-body">
              <div class="product-meta-header">
                <a href="product.html?id=${encodeURIComponent(p.id)}&color=${encodeURIComponent(activeColor)}" class="product-title-link">
                  <h3>${safe(p.name)}</h3>
                </a>
                <div class="product-price">${window.SuotStore.formatPrice(variant?.unit_price ?? p.price)}</div>
              </div>

              <div class="swatch-row" aria-label="Color Variants">
                ${p.colors
                  .map(
                    (c) => `
                    <button
                      type="button"
                      class="color-swatch ${c === activeColor ? "active" : ""}"
                      style="background-color:${window.SuotStore.getColorHex(c)};"
                      title="${safe(c)}"
                      data-card-color-prod="${safe(p.id)}"
                      data-card-color-val="${safe(c)}"
                    ></button>
                  `
                  )
                  .join("")}
                <span style="font-size:var(--text-xs);color:var(--text-muted);margin-left:2px;">${safe(activeColor)}</span>
              </div>

              <div class="card-size-row" aria-label="Quick Size Selection">
                ${p.sizes
                  .map(
                    (sz) => `
                    <button
                      type="button"
                      class="card-size-pill ${sz === activeSize ? "active" : ""}"
                      data-card-size-prod="${safe(p.id)}"
                      data-card-size-val="${safe(sz)}"
                    >${safe(sz)}</button>
                  `
                  )
                  .join("")}
              </div>

              <button type="button" class="btn-minimal-add" data-card-add="${safe(p.id)}" ${isOutOfStock || rem <= 0 ? "disabled" : ""}>
                ${isOutOfStock ? "Sold Out" : rem <= 0 ? `Max in Bag (${avail})` : `Add to Bag · ${safe(activeSize)}`}
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
      btn.addEventListener("click", async () => {
        if (!customer) { location.assign("auth.html?redirect=catalog.html"); return; }
        const card = btn.closest("[data-product-card]");
        const p = products.find(row=>row.id === btn.dataset.cardAdd);
        const color = card.querySelector(".color-swatch.active")?.dataset.cardColorVal;
        const size = card.querySelector(".card-size-pill.active")?.dataset.cardSizeVal;
        const variant = p.variants.find(row=>row.size_label === size && row.color_name === color);
        if (!variant) return;
        btn.disabled = true;
        try {
          await get("checkout",{action:"add",variant_id:variant.variant_id,quantity:1});
          const key = Number(variant.variant_id);
          bag.set(key,(bag.get(key)||0)+1);
          window.dispatchEvent(new Event("suotisla:bag-update"));
          status.textContent = p.name + " added to your bag.";
        } catch(error) { status.textContent = error.message; }
        renderCatalog();
      });
    });
  }

  function resetAllFilters() {
    state.search = "";
    state.series = "all";
    state.category = "all";
    state.size = "all";
    state.color = "all";
    state.maxPrice = priceCeiling;
    state.sort = "featured";

    if (searchInput) searchInput.value = "";
    if (priceInputEl) priceInputEl.value = priceCeiling;
    if (priceLabelEl) priceLabelEl.textContent = window.SuotStore.formatPrice(priceCeiling);
    if (sortSelectEl) sortSelectEl.value = "featured";

    withTransition(() => {
      syncUrlSeries();
      buildFilterControls(true);
      renderCatalog(true);
    });
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
      renderCatalog(true);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetAllFilters);
  }

  document.querySelectorAll("[data-quick-series]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nextSeries = btn.getAttribute("data-quick-series");
      if (nextSeries === state.series) return;
      state.series = nextSeries;
      if (state.series !== "all" && state.category !== "all") {
        const hasInCat = products
          .some((p) => p.series === state.series && p.category === state.category);
        if (!hasInCat) state.category = "all";
      }
      withTransition(() => {
        syncUrlSeries();
        buildFilterControls(true);
        renderCatalog(true);
      });
    });
  });

  let suppressSelfAddRender = false;

  window.addEventListener("suotisla:productschange", () => {
    if (!document.body.contains(gridEl)) return;
    buildFilterControls();
    renderCatalog();
  });

  window.addEventListener("suotisla:statechange", () => {
    if (suppressSelfAddRender || !document.body.contains(gridEl)) return;
    renderCatalog();
  });

  buildFilterControls();
  renderCatalog();
});
