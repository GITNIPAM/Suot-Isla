/* ==========================================================================
   Suot Isla — Persistent State & Backend Integration Layer (store.js)
   Designed for seamless localStorage demo + PHP/MySQL handover on FourSys Cloud
   ========================================================================== */

(function () {
  const KEYS = {
    PRODUCTS: "suot_isla_products_v1",
    CART: "suot_isla_cart_v1",
    COUPON: "suot_isla_coupon_v1",
    ORDERS: "suot_isla_orders_v1",
    RETURNS: "suot_isla_returns_v1",
    EMAILS: "suot_isla_emails_v1",
    USERS: "suot_isla_users_v1",
    CURRENT_USER: "suot_isla_current_user_v1"
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
    if (!localStorage.getItem(KEYS.CURRENT_USER)) {
      writeJSON(KEYS.CURRENT_USER, window.SUOT_ISLA_DATA.users[0]);
    }
    if (!localStorage.getItem(KEYS.CART)) {
      writeJSON(KEYS.CART, [
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
      ]);
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
        return `${src}?v=62`;
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

    // -------------------- Shopping Cart & Session --------------------
    getCart() {
      return readJSON(KEYS.CART, []);
    },

    addToCart(productId, size, color, qty = 1) {
      const product = this.getProductById(productId);
      if (!product) return { ok: false, message: "Product not found." };
      const chosenSize = size || product.sizes[0];
      const chosenColor = color || product.colors[0];
      const addQty = Math.max(1, parseInt(qty, 10) || 1);

      const cart = this.getCart();
      const existing = cart.find(
        (item) => item.productId === product.id && item.size === chosenSize && item.color === chosenColor
      );

      if (existing) {
        existing.qty = Math.min(product.stock || 20, existing.qty + addQty);
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
      writeJSON(KEYS.CART, cart);
      return { ok: true, cart, product };
    },

    updateCartQty(index, newQty) {
      const cart = this.getCart();
      if (!cart[index]) return cart;
      const parsed = parseInt(newQty, 10);
      if (parsed <= 0) {
        cart.splice(index, 1);
      } else {
        cart[index].qty = Math.min(25, parsed);
      }
      writeJSON(KEYS.CART, cart);
      return cart;
    },

    removeFromCart(index) {
      const cart = this.getCart();
      cart.splice(index, 1);
      writeJSON(KEYS.CART, cart);
      return cart;
    },

    clearCart() {
      writeJSON(KEYS.CART, []);
      localStorage.removeItem(KEYS.COUPON);
    },

    getAppliedCoupon() {
      return readJSON(KEYS.COUPON, null);
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
      writeJSON(KEYS.COUPON, found);
      return { ok: true, coupon: found, message: `Promo ${found.code} (${found.label}) applied!` };
    },

    removeCoupon() {
      localStorage.removeItem(KEYS.COUPON);
      window.dispatchEvent(new CustomEvent("suotisla:statechange", { detail: { key: KEYS.COUPON } }));
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
      return readJSON(KEYS.CURRENT_USER, window.SUOT_ISLA_DATA.users[0]);
    },

    loginAsRole(role) {
      const users = this.getUsers();
      const matched = users.find((u) => u.role === role) || users[0];
      writeJSON(KEYS.CURRENT_USER, matched);
      return matched;
    },

    loginAsUserId(userId) {
      const users = this.getUsers();
      const matched = users.find((u) => Number(u.id) === Number(userId)) || users[0];
      writeJSON(KEYS.CURRENT_USER, matched);
      return matched;
    },

    loginWithCredentials(email, password) {
      const users = this.getUsers();
      const found = users.find((u) => u.email.toLowerCase() === String(email).trim().toLowerCase());
      if (found) {
        writeJSON(KEYS.CURRENT_USER, found);
        return { ok: true, user: found };
      }
      const customUser = {
        id: Date.now(),
        name: String(email).split("@")[0] || "Island Traveler",
        email: String(email).trim(),
        phone: "+63 917 500 1234",
        role: "customer",
        passwordHash: "$2y$10$BcryptVerifiedSessionHash",
        joinedAt: formatNow().slice(0, 10)
      };
      users.push(customUser);
      writeJSON(KEYS.USERS, users);
      writeJSON(KEYS.CURRENT_USER, customUser);
      return { ok: true, user: customUser };
    },

    registerUser(data) {
      const users = this.getUsers();
      const newUser = {
        id: Date.now(),
        name: data.fullName || "Island Customer",
        email: data.email || "traveler@suotisla.ph",
        phone: this.normalizePhMobile(data.phone) || "09170000000",
        role: data.role || "customer",
        passwordHash: "$2y$10$" + btoa(String(data.email || "suot")).slice(0, 22),
        joinedAt: formatNow().slice(0, 10)
      };
      users.push(newUser);
      writeJSON(KEYS.USERS, users);
      writeJSON(KEYS.CURRENT_USER, newUser);
      return newUser;
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
        to: to || "mateo.alonzo@student.pcu.edu.ph",
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
      const cart = this.getCart();
      if (!cart.length) {
        return { ok: false, message: "Your island bag is empty." };
      }

      const totals = this.getCartTotals();
      const orderNumber = "SI-2026-" + Math.floor(1055 + Math.random() * 890);

      // Deduct stock per item
      cart.forEach((item) => {
        this.adjustStock(item.productId, -item.qty, false);
      });

      const newOrder = {
        orderNumber,
        userId: this.getCurrentUser().id,
        customerName: checkoutForm.fullName || this.getCurrentUser().name,
        customerEmail: checkoutForm.email || this.getCurrentUser().email,
        customerPhone: checkoutForm.phone || this.getCurrentUser().phone,
        shippingAddress: `${checkoutForm.street}, Brgy. ${checkoutForm.barangay}, ${checkoutForm.city}, ${checkoutForm.province} ${checkoutForm.postalCode}`,
        paymentMethod: checkoutForm.paymentMethod || "GCash",
        paymentRef:
          checkoutForm.paymentMethod === "COD"
            ? "COD-UPON-DELIVERY"
            : (checkoutForm.paymentMethod.slice(0, 2).toUpperCase() + "-" + Math.floor(100000000 + Math.random() * 899999999)),
        paymentStatus: checkoutForm.paymentMethod === "COD" ? "Pending" : "Paid",
        status: "Confirmed",
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
      if (!order) return null;

      order.status = newStatus;
      if (courierName) order.courierName = courierName;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (newStatus === "Delivered") {
        order.paymentStatus = "Paid";
      } else if (newStatus === "Cancelled") {
        order.paymentStatus = order.paymentStatus === "Paid" ? "Refunded" : "Cancelled";
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
            ? `Hello ${order.customerName}, your Suot Isla order #${order.orderNumber} has been cancelled. If a payment was made, your refund has been initiated.`
            : `Hello ${order.customerName}! Your Suot Isla order #${order.orderNumber} is now marked as "${newStatus}". Courier: ${order.courierName} | Tracking #: ${order.trackingNumber}.`
      });

      return order;
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

    processReturnRequest(returnId, decision, shouldRestock = true, shouldRefund = true) {
      const returnsList = this.getReturns();
      const req = returnsList.find((r) => r.returnId === returnId);
      if (!req) return null;

      if (decision === "Approved") {
        req.status = "Approved & Completed";
        if (shouldRestock && !req.restocked) {
          this.adjustStock(req.productId, req.qty, false);
          req.restocked = true;
        }
        if (shouldRefund && !req.refunded) {
          req.refunded = true;
        }
        // Update parent order status
        const orders = this.getOrders();
        const ord = orders.find((o) => o.orderNumber === req.orderNumber);
        if (ord) {
          ord.status = req.type === "Cancellation" ? "Cancelled" : "Returned";
          ord.paymentStatus = shouldRefund ? "Refunded" : ord.paymentStatus;
          writeJSON(KEYS.ORDERS, orders);
        }
      } else {
        req.status = "Rejected";
      }

      writeJSON(KEYS.RETURNS, returnsList);

      this.logEmail({
        to: req.customerEmail,
        type: "Return & Refund Update",
        orderNumber: req.orderNumber,
        subject: `[Suot Isla] Request ${req.returnId} ${decision} — Order #${req.orderNumber}`,
        body:
          decision === "Approved"
            ? `Great news ${req.customerName}! Your ${req.type} request (${req.returnId}) for Order #${req.orderNumber} has been APPROVED. ${req.refunded ? "Refund of " + this.formatPrice(req.amount) + " has been processed back to your payment method." : ""}`
            : `Hello ${req.customerName}, your request ${req.returnId} for Order #${req.orderNumber} could not be approved at this time. Please contact ola@suotisla.ph for support.`
      });

      return req;
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
