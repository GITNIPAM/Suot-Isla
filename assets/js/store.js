// Storefront display helpers.
(function () {
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
        return `${src}?v=78`;
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

    getProducts() {
      return window.SUOT_ISLA_DATA.products;
    },
    getProductById(id) {
      return this.getProducts().find(product => product.id === id);
    },
    getCartQtyForProduct() {
      return 0;
    },

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
