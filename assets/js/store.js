/* ==========================================================================
   Suot Isla — Persistent State & Backend Integration Layer (store.js)
   Designed for seamless localStorage demo + PHP/MySQL handover on FourSys Cloud
   ========================================================================== */

(function () {
  const KEYS = {
    PRODUCTS: "suot_isla_products_v1",
    CART: "suot_isla_cart_v1",
    CARTS_BY_USER: "suot_isla_carts_v2",
    COUPON: "suot_isla_coupon_v1",
    COUPONS_BY_USER: "suot_isla_coupons_v2",
    ADDRESSES_BY_USER: "suot_isla_addresses_v1",
    ORDERS: "suot_isla_orders_v1",
    RETURNS: "suot_isla_returns_v1",
    EMAILS: "suot_isla_emails_v1",
    USERS: "suot_isla_users_v1",
    CURRENT_USER: "suot_isla_current_user_v2"
  };

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("suotisla:statechange", { detail: { key } }));
    } catch (e) {
      console.error("Storage error:", e);
    }
  }

  function getUserStorageKey(user) {
    const u = arguments.length ? user : readJSON(KEYS.CURRENT_USER, null);
    if (u && u.id !== undefined && u.id !== null) return `uid-${u.id}`;
    if (u && u.email) return String(u.email).trim().toLowerCase();
    return "guest";
  }

  function ensureSeeded() {
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
      writeJSON(KEYS.PRODUCTS, window.SUOT_ISLA_DATA.products);
    }
    if (!localStorage.getItem(KEYS.ORDERS)) {
      writeJSON(KEYS.ORDERS, window.SUOT_ISLA_DATA.initialOrders);
    } else {
      const existingOrders = readJSON(KEYS.ORDERS, []);
      let changedOrders = false;
      window.SUOT_ISLA_DATA.initialOrders.forEach((seedOrd) => {
        if (!existingOrders.some((o) => o.orderNumber === seedOrd.orderNumber)) {
          existingOrders.push(seedOrd);
          changedOrders = true;
        }
      });
      if (changedOrders) localStorage.setItem(KEYS.ORDERS, JSON.stringify(existingOrders));
    }
    if (!localStorage.getItem(KEYS.RETURNS)) {
      writeJSON(KEYS.RETURNS, window.SUOT_ISLA_DATA.initialReturns);
    }
    if (!localStorage.getItem(KEYS.EMAILS)) {
      writeJSON(KEYS.EMAILS, window.SUOT_ISLA_DATA.initialEmails);
    } else {
      const existingEmails = readJSON(KEYS.EMAILS, []);
      let changedEmails = false;
      window.SUOT_ISLA_DATA.initialEmails.forEach((seedEm) => {
        if (!existingEmails.some((e) => e.id === seedEm.id)) {
          existingEmails.push(seedEm);
          changedEmails = true;
        }
      });
      if (changedEmails) localStorage.setItem(KEYS.EMAILS, JSON.stringify(existingEmails));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      writeJSON(KEYS.USERS, window.SUOT_ISLA_DATA.users);
    } else {
      const existingUsers = readJSON(KEYS.USERS, []);
      let changedUsers = false;
      window.SUOT_ISLA_DATA.users.forEach((seedUsr) => {
        if (!existingUsers.some((u) => Number(u.id) === Number(seedUsr.id))) {
          existingUsers.push(seedUsr);
          changedUsers = true;
        }
      });
      if (changedUsers) localStorage.setItem(KEYS.USERS, JSON.stringify(existingUsers));
    }
    if (!localStorage.getItem(KEYS.CARTS_BY_USER)) {
      const seedItem = [
        {
          productId: "siargao-cloud9-boardshorts",
          name: "Siargao Cloud 9 Boardshorts",
          series: "Siargao",
          category: "Swim & Surf",
          size: "32",
          color: "Lagoon Teal",
          price: 1690,
          qty: 1
        }
      ];
      const cartsMap = {
        "uid-1": seedItem
      };
      localStorage.setItem(KEYS.CARTS_BY_USER, JSON.stringify(cartsMap));
    }
    if (!localStorage.getItem(KEYS.ADDRESSES_BY_USER)) {
      const addrSeed = {
        "uid-1": [
          {
            id: "addr-1a",
            label: "Home / Campus Residence",
            badge: "Default",
            street: "Blk 4 Lot 12 Emilio Aguinaldo Hwy",
            barangay: "Sampaloc I",
            city: "Dasmariñas City",
            province: "Cavite (CALABARZON)",
            postal: "4114"
          },
          {
            id: "addr-1b",
            label: "Island Surf Hostel",
            badge: "Siargao • Cloud 9",
            street: "Tourism Road, Cloud 9 Boardwalk",
            barangay: "Catangnan",
            city: "General Luna",
            province: "Surigao del Norte",
            postal: "8419"
          }
        ],
        "uid-5": [
          {
            id: "addr-5a",
            label: "Makati City Condo",
            badge: "Default",
            street: "148 Paseo de Roxas",
            barangay: "San Lorenzo",
            city: "Makati City",
            province: "Metro Manila",
            postal: "1223"
          },
          {
            id: "addr-5b",
            label: "Boracay Island Stay",
            badge: "Boracay • Station 2",
            street: "Station 2 White Beach Path",
            barangay: "Balabag",
            city: "Malay",
            province: "Aklan",
            postal: "5608"
          }
        ]
      };
      localStorage.setItem(KEYS.ADDRESSES_BY_USER, JSON.stringify(addrSeed));
    }
  }

  ensureSeeded();

  function formatNow() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  }

  const SuotStore = {
    formatPrice(amount) {
      const n = Number(amount) || 0;
      return "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    },

    getColorHex(colorName) {
      return window.SUOT_ISLA_DATA.colorHexMap[colorName] || "#0E6B74";
    },

    withAssetVersion(src) {
      if (!src || typeof src !== "string") return src || "";
      if (src.startsWith("assets/images/") && !src.includes("?")) {
        return `${src}?v=80`;
      }
      return src;
    },

    normalizePhMobile(raw) {
      let digits = String(raw || "").replace(/\D/g, "");
      if (digits.startsWith("63") && digits.length >= 11) {
        digits = "0" + digits.slice(2);
      }
      return digits.slice(0, 11);
    },

    isValidPhMobile(raw) {
      return /^09\d{9}$/.test(this.normalizePhMobile(raw));
    },

    bindPhPhoneInput(inputEl, hintEl) {
      if (!inputEl) return;
      const sync = () => {
        const cleaned = this.normalizePhMobile(inputEl.value);
        if (inputEl.value !== cleaned) {
          inputEl.value = cleaned;
        }
        if (hintEl) {
          const len = cleaned.length;
          if (!len) {
            hintEl.textContent = "11 digits · PH format 09XXXXXXXXX";
            hintEl.classList.remove("is-valid", "is-warn");
          } else if (len === 11 && /^09\d{9}$/.test(cleaned)) {
            hintEl.textContent = `✓ ${len}/11 digits verified`;
            hintEl.classList.add("is-valid");
            hintEl.classList.remove("is-warn");
          } else if (len >= 2 && !cleaned.startsWith("09")) {
            hintEl.textContent = `${len}/11 digits · Must start with 09`;
            hintEl.classList.add("is-warn");
            hintEl.classList.remove("is-valid");
          } else {
            hintEl.textContent = `${len}/11 digits · PH format 09XXXXXXXXX`;
            hintEl.classList.remove("is-valid", "is-warn");
          }
        }
      };

      inputEl.setAttribute("maxlength", "11");
      inputEl.setAttribute("minlength", "11");
      inputEl.setAttribute("inputmode", "numeric");
      inputEl.setAttribute("pattern", "09[0-9]{9}");
      inputEl.addEventListener("input", sync);
      sync();
    },

    getProductImageForColor(product, activeColor) {
      if (!product) return "";
      const colorName = activeColor || (product.colors && product.colors[0]) || "";
      if (product.customImageUrl) return product.customImageUrl;
      if (product.colorImages && colorName && product.colorImages[colorName]) {
        return this.withAssetVersion(product.colorImages[colorName]);
      }
      return this.withAssetVersion(product.image || "");
    },

    // -------------------- Products & Inventory CRUD --------------------
    getProducts(includeArchived = false) {
      const seedMap = {};
      window.SUOT_ISLA_DATA.products.forEach((sp) => {
        seedMap[sp.id] = sp;
      });
      const list = readJSON(KEYS.PRODUCTS, window.SUOT_ISLA_DATA.products).map((p) => {
        const seed = seedMap[p.id];
        if (!seed) return p;
        return {
          ...p,
          image: p.image || seed.image,
          colorImages: p.colorImages || seed.colorImages
        };
      });
      return includeArchived ? list : list.filter((p) => !p.archived);
    },

    getProductById(id) {
      const list = this.getProducts(true);
      return list.find((p) => p.id === id) || list[0];
    },

    saveProduct(productData) {
      // Backend Handover Note: Replace with POST /api/products.php on FourSys Cloud
      const list = this.getProducts(true);
      const existingIdx = list.findIndex((p) => p.id === productData.id);
      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...productData };
      } else {
        const slug =
          productData.id ||
          productData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
        list.unshift({
          ...productData,
          id: slug,
          sku: productData.sku || "SI-NEW-" + Math.floor(100 + Math.random() * 900),
          soldCount: 0,
          archived: false
        });
      }
      writeJSON(KEYS.PRODUCTS, list);
      return list;
    },

    adjustStock(productId, deltaOrNewQty, isAbsolute = false) {
      const list = this.getProducts(true);
      const item = list.find((p) => p.id === productId);
      if (item) {
        item.stock = isAbsolute
          ? Math.max(0, parseInt(deltaOrNewQty, 10) || 0)
          : Math.max(0, (parseInt(item.stock, 10) || 0) + (parseInt(deltaOrNewQty, 10) || 0));
        item.badge = item.stock <= 5 ? "Low Stock" : item.badge === "Low Stock" ? null : item.badge;
        writeJSON(KEYS.PRODUCTS, list);
      }
      return item;
    },

    adjustProductMetrics(productId, stockDelta = 0, soldDelta = 0) {
      const list = this.getProducts(true);
      const item = list.find((p) => p.id === productId);
      if (item) {
        item.stock = Math.max(0, (parseInt(item.stock, 10) || 0) + (parseInt(stockDelta, 10) || 0));
        item.soldCount = Math.max(0, (parseInt(item.soldCount, 10) || 0) + (parseInt(soldDelta, 10) || 0));
        item.badge = item.stock <= 5 ? "Low Stock" : item.badge === "Low Stock" ? null : item.badge;
        writeJSON(KEYS.PRODUCTS, list);
      }
      return item;
    },

    toggleArchiveProduct(productId) {
      const list = this.getProducts(true);
      const item = list.find((p) => p.id === productId);
      if (item) {
        item.archived = !item.archived;
        writeJSON(KEYS.PRODUCTS, list);
      }
      return item;
    },

    deleteProduct(productId) {
      const list = this.getProducts(true).filter((p) => p.id !== productId);
      writeJSON(KEYS.PRODUCTS, list);
      return list;
    },

    // -------------------- Per-Account Saved Addresses & Cart --------------------
    getSavedAddressesForCurrentUser() {
      const curr = this.getCurrentUser();
      if (!curr) return [];
      const map = readJSON(KEYS.ADDRESSES_BY_USER, {});
      const key = getUserStorageKey(curr);
      return Array.isArray(map[key]) ? map[key] : [];
    },

    saveAddressForCurrentUser(addr) {
      const curr = this.getCurrentUser();
      if (!curr || !addr || !addr.street || !addr.city) return this.getSavedAddressesForCurrentUser();
      const map = readJSON(KEYS.ADDRESSES_BY_USER, {});
      const key = getUserStorageKey(curr);
      const list = Array.isArray(map[key]) ? [...map[key]] : [];
      const cleanStreet = String(addr.street).trim();
      const cleanCity = String(addr.city).trim();
      const exists = list.some(
        (a) =>
          String(a.street || "").trim().toLowerCase() === cleanStreet.toLowerCase() &&
          String(a.city || "").trim().toLowerCase() === cleanCity.toLowerCase()
      );
      if (!exists) {
        list.unshift({
          id: "addr-" + Date.now(),
          label: addr.label || `${cleanCity} Delivery`,
          badge: list.length === 0 ? "Default" : "Saved",
          street: cleanStreet,
          barangay: String(addr.barangay || "").trim(),
          city: cleanCity,
          province: String(addr.province || "").trim(),
          postal: String(addr.postal || addr.postalCode || "").trim()
        });
        map[key] = list;
        writeJSON(KEYS.ADDRESSES_BY_USER, map);
      }
      return list;
    },

    getCart() {
      const cartsMap = readJSON(KEYS.CARTS_BY_USER, {});
      const key = getUserStorageKey();
      return Array.isArray(cartsMap[key]) ? cartsMap[key] : [];
    },

    _saveCartForCurrentUser(cartList) {
      const cartsMap = readJSON(KEYS.CARTS_BY_USER, {});
      cartsMap[getUserStorageKey()] = Array.isArray(cartList) ? cartList : [];
      writeJSON(KEYS.CARTS_BY_USER, cartsMap);
    },

    getCartQtyForProduct(productId) {
      return this.getCart()
        .filter((i) => i.productId === productId)
        .reduce((sum, i) => sum + Number(i.qty || 0), 0);
    },

    findSimilarInStockProducts(targetProdOrId, limit = 3) {
      const target =
        typeof targetProdOrId === "object" && targetProdOrId
          ? targetProdOrId
          : this.getProductById(targetProdOrId);
      const excludeId = target ? target.id : String(targetProdOrId || "");
      const inStock = this.getProducts().filter(
        (p) => !p.archived && Number(p.stock) > 0 && p.id !== excludeId
      );
      if (!target) return inStock.slice(0, limit);

      return inStock
        .map((p) => {
          let score = 0;
          if (p.category === target.category) score += 4;
          if (p.series === target.series) score += 2;
          return { p, score };
        })
        .sort((a, b) => b.score - a.score || (b.p.soldCount || 0) - (a.p.soldCount || 0))
        .map((x) => x.p)
        .slice(0, limit);
    },

    validateCartStock() {
      const cart = this.getCart();
      const prodTotals = {};
      cart.forEach((item) => {
        prodTotals[item.productId] = (prodTotals[item.productId] || 0) + Number(item.qty || 0);
      });

      const issues = [];
      cart.forEach((item, index) => {
        const prod = this.getProductById(item.productId);
        const available = prod && !prod.archived ? Math.max(0, parseInt(prod.stock, 10) || 0) : 0;
        const requestedTotal = prodTotals[item.productId] || Number(item.qty || 0);
        if (available <= 0 || requestedTotal > available) {
          issues.push({
            index,
            item,
            product: prod,
            available,
            requestedTotal,
            shortBy: Math.max(1, requestedTotal - available),
            reason: available <= 0 ? "out_of_stock" : "insufficient_stock",
            alternatives: this.findSimilarInStockProducts(prod || item.productId, 3)
          });
        }
      });

      return { ok: issues.length === 0, issues };
    },

    swapCartItem(index, replacementProductId) {
      const cart = this.getCart();
      if (!cart[index]) return { ok: false, message: "Bag item not found." };
      const prod = this.getProductById(replacementProductId);
      if (!prod || prod.archived || (parseInt(prod.stock, 10) || 0) <= 0) {
        return { ok: false, message: "Replacement product is currently unavailable." };
      }
      const nextSize = (prod.sizes && prod.sizes[0]) || "One Size";
      const nextColor = (prod.colors && prod.colors[0]) || "Lagoon Teal";
      cart.splice(index, 1);
      this._saveCartForCurrentUser(cart);
      const added = this.addToCart(prod.id, nextSize, nextColor, 1);
      return added.ok
        ? { ok: true, product: prod, message: `Swapped to in-stock ${prod.name} (${nextSize}, ${nextColor}).` }
        : added;
    },

    addToCart(productId, size, color, qty = 1) {
      const product = this.getProductById(productId);
      if (!product || product.archived) {
        return { ok: false, reason: "unavailable", message: "This item is no longer available." };
      }
      const available = Math.max(0, parseInt(product.stock, 10) || 0);
      const alts = this.findSimilarInStockProducts(product, 3);
      if (available <= 0) {
        return {
          ok: false,
          reason: "out_of_stock",
          available: 0,
          remaining: 0,
          message: `${product.name} is currently out of stock.`,
          alternatives: alts
        };
      }

      const chosenSize = size || product.sizes[0];
      const chosenColor = color || product.colors[0];
      const addQty = Math.max(1, parseInt(qty, 10) || 1);
      const alreadyInCart = this.getCartQtyForProduct(product.id);

      if (alreadyInCart + addQty > available) {
        const remaining = Math.max(0, available - alreadyInCart);
        return {
          ok: false,
          reason: "insufficient_stock",
          available,
          alreadyInCart,
          remaining,
          message:
            remaining === 0
              ? `All ${available} available unit(s) of ${product.name} are already in your bag.`
              : `Only ${remaining} more unit(s) of ${product.name} available (${available} total in stock).`,
          alternatives: alts
        };
      }

      const cart = this.getCart();
      const existing = cart.find(
        (item) => item.productId === product.id && item.size === chosenSize && item.color === chosenColor
      );

      if (existing) {
        existing.qty += addQty;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          series: product.series,
          category: product.category,
          size: chosenSize,
          color: chosenColor,
          price: Number(product.price),
          qty: addQty
        });
      }
      this._saveCartForCurrentUser(cart);
      return { ok: true, cart, product, remaining: Math.max(0, available - (alreadyInCart + addQty)) };
    },

    updateCartQty(index, newQty) {
      const cart = this.getCart();
      if (!cart[index]) return { ok: false, cart };
      const parsed = parseInt(newQty, 10);
      if (isNaN(parsed) || parsed <= 0) {
        cart.splice(index, 1);
        this._saveCartForCurrentUser(cart);
        return { ok: true, cart, clamped: false };
      }

      const targetItem = cart[index];
      const prod = this.getProductById(targetItem.productId);
      const stockCap = prod && !prod.archived ? Math.max(0, parseInt(prod.stock, 10) || 0) : 0;
      const otherVariantsQty = cart
        .filter((it, idx) => idx !== index && it.productId === targetItem.productId)
        .reduce((sum, it) => sum + Number(it.qty || 0), 0);
      const maxForLine = Math.max(0, stockCap - otherVariantsQty);

      if (maxForLine <= 0) {
        return {
          ok: false,
          cart,
          clamped: true,
          message: `${targetItem.name} is out of stock. Remove it or swap for a similar item.`
        };
      }

      const finalQty = Math.min(25, maxForLine, parsed);
      const wasClamped = parsed > maxForLine;
      targetItem.qty = finalQty;
      this._saveCartForCurrentUser(cart);
      return {
        ok: !wasClamped,
        cart,
        clamped: wasClamped,
        message: wasClamped ? `Maximum available stock for ${targetItem.name} is ${stockCap}.` : ""
      };
    },

    removeFromCart(index) {
      const cart = this.getCart();
      cart.splice(index, 1);
      this._saveCartForCurrentUser(cart);
      return cart;
    },

    clearCart() {
      const cartsMap = readJSON(KEYS.CARTS_BY_USER, {});
      cartsMap[getUserStorageKey()] = [];
      writeJSON(KEYS.CARTS_BY_USER, cartsMap);

      const couponsMap = readJSON(KEYS.COUPONS_BY_USER, {});
      delete couponsMap[getUserStorageKey()];
      writeJSON(KEYS.COUPONS_BY_USER, couponsMap);
    },

    getAppliedCoupon() {
      const couponsMap = readJSON(KEYS.COUPONS_BY_USER, {});
      return couponsMap[getUserStorageKey()] || null;
    },

    applyCoupon(codeInput) {
      const clean = String(codeInput || "").trim().toUpperCase();
      const found = window.SUOT_ISLA_DATA.coupons.find((c) => c.code === clean);
      if (!found) {
        return { ok: false, message: "Invalid promo code. Try ISLA10, SURF15, or FREESHIP." };
      }
      const subtotal = this.getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
      if (subtotal < found.minSpend) {
        return {
          ok: false,
          message: `Code ${found.code} requires a minimum spend of ${this.formatPrice(found.minSpend)}.`
        };
      }
      const couponsMap = readJSON(KEYS.COUPONS_BY_USER, {});
      couponsMap[getUserStorageKey()] = found;
      writeJSON(KEYS.COUPONS_BY_USER, couponsMap);
      return { ok: true, coupon: found, message: `Promo ${found.code} (${found.label}) applied!` };
    },

    removeCoupon() {
      const couponsMap = readJSON(KEYS.COUPONS_BY_USER, {});
      delete couponsMap[getUserStorageKey()];
      writeJSON(KEYS.COUPONS_BY_USER, couponsMap);
    },

    getCartTotals() {
      const cart = this.getCart();
      const itemCount = cart.reduce((acc, item) => acc + item.qty, 0);
      const subtotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
      let deliveryFee = subtotal === 0 ? 0 : subtotal >= 3500 ? 0 : 150;
      let discount = 0;

      const coupon = this.getAppliedCoupon();
      if (coupon && subtotal >= coupon.minSpend) {
        if (coupon.type === "percentage") {
          discount = Math.round(subtotal * (coupon.value / 100));
        } else if (coupon.type === "free_shipping") {
          discount = deliveryFee;
          deliveryFee = 0;
        }
      }

      const total = Math.max(0, subtotal - discount + deliveryFee);
      return { itemCount, subtotal, discount, deliveryFee, total, coupon };
    },

    // -------------------- Authentication & RBAC Roles --------------------
    getUsers() {
      return readJSON(KEYS.USERS, window.SUOT_ISLA_DATA.users);
    },

    getCurrentUser() {
      return readJSON(KEYS.CURRENT_USER, null);
    },

    _mergeGuestSessionIntoUser(user) {
      if (!user) return { mergedCount: 0, clampedCount: 0 };
      const userKey = getUserStorageKey(user);
      if (userKey === "guest") return { mergedCount: 0, clampedCount: 0 };

      const cartsMap = readJSON(KEYS.CARTS_BY_USER, {});
      const guestCart = Array.isArray(cartsMap.guest) ? cartsMap.guest : [];
      let mergedCount = 0;
      let clampedCount = 0;

      if (guestCart.length) {
        const targetCart = Array.isArray(cartsMap[userKey]) ? cartsMap[userKey].map((i) => ({ ...i })) : [];
        guestCart.forEach((gItem) => {
          const prod = this.getProductById(gItem.productId);
          if (!prod || prod.archived) {
            clampedCount += Number(gItem.qty || 1);
            return;
          }
          const stockCap = Math.max(0, parseInt(prod.stock, 10) || 0);
          if (stockCap <= 0) {
            clampedCount += Number(gItem.qty || 1);
            return;
          }
          const inTarget = targetCart
            .filter((it) => it.productId === prod.id)
            .reduce((sum, it) => sum + Number(it.qty || 0), 0);
          const availToAdd = Math.max(0, stockCap - inTarget);
          const wanted = Math.max(1, parseInt(gItem.qty, 10) || 1);
          const actualAdd = Math.min(availToAdd, wanted);
          if (actualAdd < wanted) clampedCount += wanted - actualAdd;
          if (actualAdd <= 0) return;

          const existing = targetCart.find(
            (it) => it.productId === prod.id && it.size === gItem.size && it.color === gItem.color
          );
          if (existing) {
            existing.qty += actualAdd;
          } else {
            targetCart.push({
              ...gItem,
              qty: actualAdd
            });
          }
          mergedCount += actualAdd;
        });

        cartsMap[userKey] = targetCart;
        delete cartsMap.guest;
        localStorage.setItem(KEYS.CARTS_BY_USER, JSON.stringify(cartsMap));
      }

      const couponsMap = readJSON(KEYS.COUPONS_BY_USER, {});
      if (couponsMap.guest) {
        if (!couponsMap[userKey]) {
          couponsMap[userKey] = couponsMap.guest;
        }
        delete couponsMap.guest;
        localStorage.setItem(KEYS.COUPONS_BY_USER, JSON.stringify(couponsMap));
      }

      return { mergedCount, clampedCount };
    },

    loginAsRole(role) {
      const users = this.getUsers();
      const matched = users.find((u) => u.role === role) || users[0];
      const mergeInfo = this._mergeGuestSessionIntoUser(matched);
      writeJSON(KEYS.CURRENT_USER, matched);
      return { ...matched, mergedGuestItems: mergeInfo.mergedCount, clampedGuestItems: mergeInfo.clampedCount };
    },

    loginAsUserId(userId) {
      const users = this.getUsers();
      const matched = users.find((u) => Number(u.id) === Number(userId)) || users[0];
      const mergeInfo = this._mergeGuestSessionIntoUser(matched);
      writeJSON(KEYS.CURRENT_USER, matched);
      return { ...matched, mergedGuestItems: mergeInfo.mergedCount, clampedGuestItems: mergeInfo.clampedCount };
    },

    logout() {
      writeJSON(KEYS.CURRENT_USER, null);
      return { ok: true };
    },

    hashDemoPassword(raw) {
      const str = `suot-isla-salt:${String(raw || "")}`;
      let h1 = 0x811c9dc5;
      let h2 = 0x9e3779b9;
      for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 ^= ch;
        h1 = Math.imul(h1, 0x01000193);
        h2 ^= ch + i;
        h2 = Math.imul(h2, 0x85ebca6b);
      }
      return `$si26$${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
    },

    loginWithCredentials(email, password) {
      const cleanEmail = String(email || "").trim().toLowerCase();
      if (!cleanEmail) {
        return { ok: false, field: "email", message: "Please enter your email address." };
      }
      if (!password) {
        return { ok: false, field: "password", message: "Please enter your password." };
      }

      const users = this.getUsers();
      const found = users.find((u) => String(u.email || "").trim().toLowerCase() === cleanEmail);
      if (!found) {
        return {
          ok: false,
          field: "email",
          message: "No Suot Isla account matches that email. Switch to Create Account to register."
        };
      }

      const expectedDigest = found.passwordDigest || this.hashDemoPassword("SuotIsla2026!");
      const enteredDigest = this.hashDemoPassword(password);
      if (enteredDigest !== expectedDigest) {
        return {
          ok: false,
          field: "password",
          message: "Incorrect password. Please check your password and try again."
        };
      }

      if (!found.passwordDigest) {
        found.passwordDigest = expectedDigest;
        writeJSON(KEYS.USERS, users);
      }
      const mergeInfo = this._mergeGuestSessionIntoUser(found);
      writeJSON(KEYS.CURRENT_USER, found);
      return {
        ok: true,
        user: found,
        mergedGuestItems: mergeInfo.mergedCount,
        clampedGuestItems: mergeInfo.clampedCount
      };
    },

    registerUser(data) {
      const cleanEmail = String(data.email || "").trim().toLowerCase();
      const users = this.getUsers();
      if (users.some((u) => String(u.email || "").trim().toLowerCase() === cleanEmail)) {
        return {
          ok: false,
          field: "email",
          message: "An account with this email already exists. Please sign in instead."
        };
      }
      if (!data.password || String(data.password).length < 8) {
        return {
          ok: false,
          field: "password",
          message: "Password must be at least 8 characters."
        };
      }

      const newUser = {
        id: Date.now(),
        name: data.fullName || "Island Customer",
        email: String(data.email || "").trim(),
        phone: this.normalizePhMobile(data.phone) || "09170000000",
        role: data.role || "customer",
        passwordDigest: this.hashDemoPassword(data.password),
        passwordHash: "$2y$10$" + btoa(cleanEmail || "suot").slice(0, 22),
        joinedAt: formatNow().slice(0, 10)
      };
      users.push(newUser);
      writeJSON(KEYS.USERS, users);
      const mergeInfo = this._mergeGuestSessionIntoUser(newUser);
      writeJSON(KEYS.CURRENT_USER, newUser);
      return {
        ok: true,
        user: newUser,
        mergedGuestItems: mergeInfo.mergedCount,
        clampedGuestItems: mergeInfo.clampedCount
      };
    },

    updateUserRole(userId, newRole) {
      const users = this.getUsers();
      const target = users.find((u) => Number(u.id) === Number(userId));
      if (target) {
        target.role = newRole;
        writeJSON(KEYS.USERS, users);
        const curr = this.getCurrentUser();
        if (curr && Number(curr.id) === Number(userId)) {
          writeJSON(KEYS.CURRENT_USER, target);
        }
      }
      return users;
    },

    belongsToUser(record, user) {
      if (!record || !user) return false;
      if (record.userId !== undefined && record.userId !== null && user.id !== undefined) {
        if (Number(record.userId) === Number(user.id)) return true;
      }
      const recEmail = String(record.customerEmail || record.to || "").trim().toLowerCase();
      const usrEmail = String(user.email || "").trim().toLowerCase();
      return Boolean(recEmail && usrEmail && recEmail === usrEmail);
    },

    // -------------------- Orders, Fulfillment & Email Notifications --------------------
    getOrders() {
      const list = readJSON(KEYS.ORDERS, window.SUOT_ISLA_DATA.initialOrders);
      let migrated = false;
      const cleaned = list.map((o) => {
        if (o && (o.paymentMethod === "Maya" || o.paymentMethod === "Card")) {
          migrated = true;
          return {
            ...o,
            paymentMethod: "GCash",
            paymentRef: typeof o.paymentRef === "string" ? o.paymentRef.replace(/^MY-/, "GC-") : o.paymentRef
          };
        }
        return o;
      });
      if (migrated) writeJSON(KEYS.ORDERS, cleaned);
      return cleaned;
    },

    getOrdersForCurrentUser() {
      const curr = this.getCurrentUser();
      return this.getOrders().filter((o) => this.belongsToUser(o, curr));
    },

    getEmails() {
      return readJSON(KEYS.EMAILS, window.SUOT_ISLA_DATA.initialEmails);
    },

    getEmailsForCurrentUser() {
      const curr = this.getCurrentUser();
      return this.getEmails().filter((e) => this.belongsToUser(e, curr));
    },

    logEmail({ to, type, orderNumber, subject, body }) {
      const emails = this.getEmails();
      const entry = {
        id: "EM-" + Math.floor(100 + Math.random() * 899),
        to: to || "",
        type,
        orderNumber,
        subject,
        body,
        sentAt: formatNow()
      };
      emails.unshift(entry);
      writeJSON(KEYS.EMAILS, emails);
      return entry;
    },

    placeOrder(checkoutForm) {
      const curr = this.getCurrentUser();
      if (!curr) {
        return {
          ok: false,
          reason: "auth_required",
          message: "Please sign in or create a customer account before placing your order."
        };
      }
      const cart = this.getCart();
      if (!cart.length) {
        return { ok: false, reason: "empty", message: "Your island bag is empty." };
      }

      const stockCheck = this.validateCartStock();
      if (!stockCheck.ok) {
        return {
          ok: false,
          reason: "stock",
          issues: stockCheck.issues,
          message:
            "Stock check failed: some items exceed available units or are out of stock. Review options in your summary."
        };
      }

      const method = checkoutForm.paymentMethod || "GCash";
      if (method === "GCash" && !checkoutForm.paymentConfirmed) {
        return {
          ok: false,
          reason: "payment_unconfirmed",
          message: "Please verify your GCash payment confirmation code before completing this transaction."
        };
      }
      if (!checkoutForm.paymentConfirmed) {
        return {
          ok: false,
          reason: "payment_unconfirmed",
          message: "Please confirm your order details before submitting."
        };
      }

      const totals = this.getCartTotals();
      const orderNumber = "SI-2026-" + Math.floor(1055 + Math.random() * 890);

      // Deduct stock and record live sold count per item
      cart.forEach((item) => {
        this.adjustProductMetrics(item.productId, -item.qty, item.qty);
      });

      const verifiedPhone = this.normalizePhMobile(checkoutForm.phone) || this.normalizePhMobile(curr.phone) || checkoutForm.phone;

      const newOrder = {
        orderNumber,
        userId: curr.id,
        customerName: checkoutForm.fullName || curr.name,
        customerEmail: checkoutForm.email || curr.email,
        customerPhone: verifiedPhone,
        shippingAddress: `${checkoutForm.street}, Brgy. ${checkoutForm.barangay}, ${checkoutForm.city}, ${checkoutForm.province} ${checkoutForm.postalCode}`,
        paymentMethod: method,
        paymentRef:
          method === "COD"
            ? "COD-UPON-DELIVERY"
            : checkoutForm.paymentRef || "GC-" + Math.floor(100000000 + Math.random() * 899999999),
        paymentStatus: method === "COD" ? "Pending" : "Paid",
        status: "Confirmed",
        stockRestocked: false,
        courierName: "Awaiting Courier Assignment",
        trackingNumber: "ISLA-TRK-" + Math.floor(10000 + Math.random() * 89999),
        placedAt: formatNow(),
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        discount: totals.discount,
        total: totals.total,
        items: cart.map((c) => ({ ...c }))
      };

      const orders = this.getOrders();
      orders.unshift(newOrder);
      writeJSON(KEYS.ORDERS, orders);

      this.saveAddressForCurrentUser({
        label: `${checkoutForm.city || "Island"} Address`,
        street: checkoutForm.street,
        barangay: checkoutForm.barangay,
        city: checkoutForm.city,
        province: checkoutForm.province,
        postal: checkoutForm.postalCode
      });

      // Trigger Order Confirmation Email
      const emailSent = this.logEmail({
        to: newOrder.customerEmail,
        type: "Order Confirmation",
        orderNumber: newOrder.orderNumber,
        subject: `[Suot Isla] Order Confirmation #${newOrder.orderNumber} (${this.formatPrice(newOrder.total)})`,
        body: `Mabuhay ${newOrder.customerName}! Thank you for shopping with Suot Isla. Your order #${newOrder.orderNumber} (${newOrder.items.length} item/s) has been confirmed and stock is reserved. Shipping to: ${newOrder.shippingAddress}.`
      });

      this.clearCart();
      return { ok: true, order: newOrder, email: emailSent };
    },

    updateOrderStatus(orderNumber, newStatus, courierName, trackingNumber) {
      const orders = this.getOrders();
      const order = orders.find((o) => o.orderNumber === orderNumber);
      if (!order) return { ok: false, message: "Order not found." };

      const prevStatus = order.status;
      if (newStatus === "Cancelled") {
        if (prevStatus === "Cancelled" || prevStatus === "Returned") {
          return { ok: false, message: `Order #${orderNumber} is already ${prevStatus}.` };
        }
        if (prevStatus === "Delivered") {
          return {
            ok: false,
            message: `Order #${orderNumber} was already Delivered. Use Returns & Refunds to restock or refund.`
          };
        }
      }

      if ((prevStatus === "Cancelled" || prevStatus === "Returned") && newStatus !== prevStatus) {
        return {
          ok: false,
          message: `Closed orders (${prevStatus}) cannot be moved back into "${newStatus}".`
        };
      }

      order.status = newStatus;
      if (courierName) order.courierName = courierName;
      if (trackingNumber) order.trackingNumber = trackingNumber;

      let restockedUnits = 0;
      const wasPaid = order.paymentStatus === "Paid";

      if (newStatus === "Delivered") {
        order.paymentStatus = "Paid";
      } else if (newStatus === "Cancelled") {
        order.cancelledAt = formatNow();
        order.paymentStatus = wasPaid ? "Refund Pending" : "Cancelled";
        if (!order.stockRestocked) {
          (order.items || []).forEach((it) => {
            const qty = Number(it.qty || 1);
            this.adjustProductMetrics(it.productId, qty, -qty);
            restockedUnits += qty;
          });
          order.stockRestocked = true;
        }

        if (wasPaid) {
          const returnsList = this.getReturns();
          const hasQueue = returnsList.some((r) => r.orderNumber === order.orderNumber && !r.status.includes("Rejected"));
          if (!hasQueue) {
            const firstItem = order.items && order.items[0] ? order.items[0] : null;
            returnsList.unshift({
              returnId: "RET-2026-" + Math.floor(100 + Math.random() * 899),
              userId: order.userId,
              orderNumber: order.orderNumber,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              type: "Cancellation",
              itemSummary: firstItem
                ? `${firstItem.name}${order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}`
                : `Order #${order.orderNumber}`,
              productId: firstItem ? firstItem.productId : "siargao-cloud9-boardshorts",
              qty: firstItem ? firstItem.qty : 1,
              amount: Number(order.total || 0),
              reason: "Cancelled Before Dispatch",
              notes: "Order cancelled after payment; queued for refund reference verification.",
              status: "Approved · Awaiting Refund",
              restocked: true,
              refunded: false,
              requestedAt: formatNow()
            });
            writeJSON(KEYS.RETURNS, returnsList);
          }
        }
      }

      writeJSON(KEYS.ORDERS, orders);

      // Dispatch automatic email notification based on status
      const emailType = newStatus === "Cancelled" ? "Cancellation Alert" : "Shipping Update";
      this.logEmail({
        to: order.customerEmail,
        type: emailType,
        orderNumber: order.orderNumber,
        subject: `[Suot Isla] Order #${order.orderNumber} Status Updated: ${newStatus}`,
        body:
          newStatus === "Cancelled"
            ? `Hello ${order.customerName}, your Suot Isla order #${order.orderNumber} has been cancelled (${restockedUnits} unit/s restocked). ${wasPaid ? "Your refund is now queued for transaction verification." : "No payment reversal is required for Cash on Delivery."}`
            : `Hello ${order.customerName}! Your Suot Isla order #${order.orderNumber} is now marked as "${newStatus}". Courier: ${order.courierName} | Tracking #: ${order.trackingNumber}.`
      });

      return { ok: true, order, restockedUnits };
    },

    // -------------------- Returns, Cancellations & Refunds --------------------
    getReturns() {
      return readJSON(KEYS.RETURNS, window.SUOT_ISLA_DATA.initialReturns);
    },

    getReturnsForCurrentUser() {
      const curr = this.getCurrentUser();
      return this.getReturns().filter((r) => this.belongsToUser(r, curr));
    },

    submitReturnRequest(payload) {
      const returnsList = this.getReturns();
      const orders = this.getOrders();
      const curr = this.getCurrentUser();
      const order = orders.find((o) => o.orderNumber === payload.orderNumber) || orders[0];
      const firstItem = order && order.items && order.items[0] ? order.items[0] : null;

      const newReq = {
        returnId: "RET-2026-" + Math.floor(100 + Math.random() * 899),
        userId: order ? order.userId : curr.id,
        orderNumber: payload.orderNumber,
        customerName: order ? order.customerName : curr.name,
        customerEmail: order ? order.customerEmail : curr.email,
        type: payload.type || "Return & Refund",
        itemSummary:
          payload.itemSummary ||
          (firstItem ? `${firstItem.name} (${firstItem.size}, ${firstItem.color})` : "Order Items"),
        productId: firstItem ? firstItem.productId : "siargao-cloud9-boardshorts",
        qty: firstItem ? firstItem.qty : 1,
        amount: order ? order.total : 1690,
        reason: payload.reason || "Size / Fit Issue",
        notes: payload.notes || "",
        status: "Pending Review",
        restocked: false,
        refunded: false,
        requestedAt: formatNow()
      };

      returnsList.unshift(newReq);
      writeJSON(KEYS.RETURNS, returnsList);

      this.logEmail({
        to: newReq.customerEmail,
        type: newReq.type === "Cancellation" ? "Cancellation Request" : "Return Request",
        orderNumber: newReq.orderNumber,
        subject: `[Suot Isla] ${newReq.type} Request Received (${newReq.returnId})`,
        body: `We received your ${newReq.type.toLowerCase()} request (${newReq.returnId}) for Order #${newReq.orderNumber}. Reason: ${newReq.reason}. You can track approval status in your Customer Dashboard.`
      });

      return newReq;
    },

    processReturnRequest(returnId, decision, shouldRestock = true) {
      const returnsList = this.getReturns();
      const req = returnsList.find((r) => r.returnId === returnId);
      if (!req) return { ok: false, message: "Return request not found." };
      if (!req.status.includes("Pending")) {
        return { ok: false, message: `Request ${returnId} is already processed (${req.status}).` };
      }

      const orders = this.getOrders();
      const ord = orders.find((o) => o.orderNumber === req.orderNumber);
      const isPaidOrder = !ord || ord.paymentStatus === "Paid" || ord.status === "Delivered";

      if (decision === "Approved") {
        if (shouldRestock && !req.restocked && (!ord || !ord.stockRestocked)) {
          this.adjustProductMetrics(req.productId, req.qty, -req.qty);
          req.restocked = true;
          if (ord) ord.stockRestocked = true;
        }
        req.approvedAt = formatNow();
        req.refunded = false;

        if (isPaidOrder) {
          req.status = "Approved · Awaiting Refund";
          if (ord) {
            ord.status = req.type === "Cancellation" ? "Cancelled" : "Returned";
            ord.paymentStatus = "Refund Pending";
            writeJSON(KEYS.ORDERS, orders);
          }
        } else {
          req.status = "Approved & Closed (Unpaid COD)";
          if (ord) {
            ord.status = "Cancelled";
            ord.paymentStatus = "Cancelled";
            writeJSON(KEYS.ORDERS, orders);
          }
        }
      } else {
        req.status = "Rejected";
      }

      writeJSON(KEYS.RETURNS, returnsList);

      this.logEmail({
        to: req.customerEmail,
        type: "Return & Refund Update",
        orderNumber: req.orderNumber,
        subject:
          decision === "Approved"
            ? `[Suot Isla] Request ${req.returnId} Approved — Order #${req.orderNumber}`
            : `[Suot Isla] Request ${req.returnId} Update — Order #${req.orderNumber}`,
        body:
          decision === "Approved"
            ? isPaidOrder
              ? `Great news ${req.customerName}! Your ${req.type} (${req.returnId}) for Order #${req.orderNumber} is approved. Your refund of ${this.formatPrice(req.amount)} is now queued for payout transaction confirmation.`
              : `Your cancellation (${req.returnId}) for COD Order #${req.orderNumber} is approved and closed with no balance due.`
            : `Hello ${req.customerName}, your request ${req.returnId} for Order #${req.orderNumber} could not be approved at this time. Please contact ola@suotisla.ph for support.`
      });

      return { ok: true, request: req };
    },

    confirmReturnRefund(returnId, settlement = {}) {
      const returnsList = this.getReturns();
      const req = returnsList.find((r) => r.returnId === returnId);
      if (!req) return { ok: false, message: "Return request not found." };
      if (req.status !== "Approved · Awaiting Refund" || req.refunded) {
        return { ok: false, message: "Return request is not awaiting refund settlement." };
      }

      const cleanRef = String(settlement.refundRef || "").trim();
      if (cleanRef.length < 6) {
        return {
          ok: false,
          field: "refundRef",
          message: "Enter a valid payout transaction reference # (at least 6 characters)."
        };
      }
      if (!settlement.verified) {
        return {
          ok: false,
          field: "verified",
          message: "Check the confirmation box to verify the refund transaction was sent."
        };
      }

      req.status = "Refunded & Completed";
      req.refunded = true;
      req.refundMethod = settlement.refundMethod || "GCash Express Refund";
      req.refundRef = cleanRef;
      req.refundNotes = String(settlement.notes || "").trim();
      req.refundedAt = formatNow();

      const orders = this.getOrders();
      const ord = orders.find((o) => o.orderNumber === req.orderNumber);
      if (ord) {
        ord.status = req.type === "Cancellation" ? "Cancelled" : "Returned";
        ord.paymentStatus = "Refunded";
        ord.refundMethod = req.refundMethod;
        ord.refundRef = req.refundRef;
        ord.refundedAt = req.refundedAt;
        writeJSON(KEYS.ORDERS, orders);
      }

      writeJSON(KEYS.RETURNS, returnsList);

      this.logEmail({
        to: req.customerEmail,
        type: "Return & Refund Update",
        orderNumber: req.orderNumber,
        subject: `[Suot Isla] Refund Paid (${req.refundRef}) — Order #${req.orderNumber}`,
        body: `Mabuhay ${req.customerName}! Your refund of ${this.formatPrice(req.amount)} for #${req.orderNumber} (${req.returnId}) has been completed via ${req.refundMethod} (Transaction Ref: ${req.refundRef}). Your updated E-Receipt is ready in your dashboard.`
      });

      return { ok: true, request: req };
    },

    // -------------------- Studio Product Visual Renderer --------------------
    renderProductVisual(product, activeColor) {
      const colorName = activeColor || (product.colors && product.colors[0]) || "Lagoon Teal";
      const fillHex = this.getColorHex(colorName);
      const mappedColorPhoto = !product.customImageUrl && product.colorImages && product.colorImages[colorName];
      const photoSrc = this.withAssetVersion(product.customImageUrl || mappedColorPhoto || product.image);

      if (photoSrc) {
        const isPrimaryColor = product.colors && colorName === product.colors[0];
        const needsFallbackTint = !mappedColorPhoto && !isPrimaryColor;
        return `
          <div class="studio-photo-wrap">
            <img src="${photoSrc}" alt="${product.name} in ${colorName}" class="studio-product-img" loading="lazy" />
            ${
              needsFallbackTint
                ? `<span class="studio-color-tint" style="background-color:${fillHex};" aria-hidden="true"></span>`
                : ""
            }
          </div>
        `;
      }

      const isLight = ["#F9F6EE", "#F7F5F0", "#EFE7D6", "#E8D7B9", "#E5D8C1", "#E2D5BE"].includes(fillHex);
      const strokeHex = isLight ? "#092C30" : "#FAF6EE";

      const shapes = {
        shorts: `
          <path d="M28 24 H92 L98 86 L66 86 L60 54 L54 86 L22 86 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="28" y="24" width="64" height="11" fill="#092C30" rx="2"/>
          <path d="M56 30 V46 M64 30 V46" stroke="#F4EAD5" stroke-width="2" stroke-linecap="round"/>
          <circle cx="56" cy="47" r="2" fill="#F27D63"/>
          <circle cx="64" cy="47" r="2" fill="#F27D63"/>
          <path d="M25 74 Q42 68 55 74 M65 74 Q80 68 95 74" stroke="${strokeHex}" stroke-width="1.6" fill="none" opacity="0.65"/>
        `,
        surfsuit: `
          <path d="M42 18 H78 L98 48 L88 55 L76 38 V68 L60 94 L44 68 V38 L32 55 L22 48 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="60" y1="18" x2="60" y2="54" stroke="${strokeHex}" stroke-width="2" stroke-linecap="round"/>
          <circle cx="60" cy="24" r="3" fill="#F27D63"/>
        `,
        poncho: `
          <path d="M46 16 Q60 8 74 16 L102 42 L90 54 L82 46 V94 H38 V46 L30 54 L18 42 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <rect x="46" y="58" width="28" height="16" rx="3" fill="none" stroke="${strokeHex}" stroke-width="1.8"/>
        `,
        drybag: `
          <rect x="38" y="28" width="44" height="64" rx="8" fill="${fillHex}" stroke="#092C30" stroke-width="2.5"/>
          <rect x="34" y="20" width="52" height="9" rx="3" fill="#092C30"/>
          <path d="M40 20 Q60 8 80 20" fill="none" stroke="#092C30" stroke-width="2.2"/>
          <circle cx="60" cy="58" r="11" fill="#FAF6EE" stroke="#092C30" stroke-width="1.8"/>
          <path d="M53 59 Q60 53 67 59" stroke="#0E6B74" stroke-width="2" fill="none"/>
        `,
        shirt: `
          <path d="M42 20 L60 28 L78 20 L100 38 L88 52 L78 44 V90 H42 V44 L32 52 L20 38 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="60" y1="28" x2="60" y2="90" stroke="${strokeHex}" stroke-width="1.6"/>
          <circle cx="60" cy="42" r="2" fill="#092C30"/>
          <circle cx="60" cy="56" r="2" fill="#092C30"/>
          <circle cx="60" cy="70" r="2" fill="#092C30"/>
        `,
        trousers: `
          <path d="M36 16 H84 L90 94 H66 L60 44 L54 94 H30 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <line x1="36" y1="25" x2="84" y2="25" stroke="#092C30" stroke-width="2"/>
          <path d="M57 22 V34 M63 22 V34" stroke="#092C30" stroke-width="1.8" stroke-linecap="round"/>
        `,
        sarong: `
          <path d="M32 22 H88 L94 90 H26 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M30 22 Q60 34 90 22" fill="none" stroke="#092C30" stroke-width="2.5"/>
          <path d="M34 68 Q60 58 86 68 M32 78 Q60 68 88 78" fill="none" stroke="${strokeHex}" stroke-width="1.8" opacity="0.75"/>
        `,
        tote: `
          <path d="M26 38 H94 L84 90 H36 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M44 38 V22 Q60 12 76 22 V38" fill="none" stroke="#092C30" stroke-width="3" stroke-linecap="round"/>
          <line x1="34" y1="54" x2="86" y2="54" stroke="#092C30" stroke-width="1.5" stroke-dasharray="4 3"/>
          <line x1="36" y1="70" x2="84" y2="70" stroke="#092C30" stroke-width="1.5" stroke-dasharray="4 3"/>
        `,
        rashguard: `
          <path d="M44 18 H76 L98 68 L84 74 L74 44 V88 H46 V44 L36 74 L22 68 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M48 48 Q60 40 72 48" fill="none" stroke="${strokeHex}" stroke-width="2" stroke-linecap="round"/>
        `,
        throw: `
          <circle cx="60" cy="56" r="36" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-dasharray="6 3"/>
          <circle cx="60" cy="56" r="24" fill="none" stroke="${strokeHex}" stroke-width="1.8"/>
          <circle cx="60" cy="56" r="10" fill="#F27D63" opacity="0.85"/>
        `,
        towel: `
          <rect x="32" y="20" width="56" height="72" rx="4" fill="${fillHex}" stroke="#092C30" stroke-width="2.5"/>
          <line x1="32" y1="34" x2="88" y2="34" stroke="${strokeHex}" stroke-width="2"/>
          <line x1="32" y1="78" x2="88" y2="78" stroke="${strokeHex}" stroke-width="2"/>
        `,
        tee: `
          <path d="M42 20 H78 L100 40 L86 54 L76 44 V88 H44 V44 L34 54 L20 40 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="60" cy="52" r="12" fill="none" stroke="${strokeHex}" stroke-width="1.8"/>
          <path d="M52 54 Q60 48 68 54" fill="none" stroke="${strokeHex}" stroke-width="1.8"/>
        `,
        cap: `
          <path d="M28 62 C28 36, 88 36, 88 62 Z" fill="${fillHex}" stroke="#092C30" stroke-width="2.5"/>
          <path d="M22 62 H102 C102 70, 84 72, 68 68 H22 Z" fill="#092C30"/>
          <rect x="48" y="45" width="20" height="10" rx="2" fill="#FAF6EE" stroke="#092C30" stroke-width="1.5"/>
        `
      };

      const shapeMarkup = shapes[product.silhouette] || shapes.tee;
      return `
        <svg viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${product.name} in ${colorName}">
          ${shapeMarkup}
        </svg>
      `;
    }
  };

  window.SuotStore = SuotStore;
})();
