/* ==========================================================================
   Suot Isla — Overdrive Coastal Shader & Interactive Motion Layer
   WebGL2 / Canvas2D Sunlit Ocean Caustics + Scroll Reveals + Magnetic CTA
   ========================================================================== */

(function () {
  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initOceanCanvas() {
    const canvas = document.getElementById("hero-ocean-canvas");
    if (!canvas || prefersReduced) return;

    const heroSection = canvas.closest(".hero-immersive");
    let isVisible = true;
    let targetMouse = { x: 0.5, y: 0.5 };
    let smoothMouse = { x: 0.5, y: 0.5 };

    if (heroSection) {
      heroSection.addEventListener("pointermove", (e) => {
        const rect = heroSection.getBoundingClientRect();
        targetMouse.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        targetMouse.y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      });
    }

    if ("IntersectionObserver" in window && heroSection) {
      const observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0] ? entries[0].isIntersecting : true;
        },
        { threshold: 0.02 }
      );
      observer.observe(heroSection);
    }

    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false });
    if (gl) {
      const vsSource = `#version 300 es
        in vec2 aPos;
        out vec2 vUv;
        void main() {
          vUv = aPos * 0.5 + 0.5;
          gl_Position = vec4(aPos, 0.0, 1.0);
        }
      `;

      const fsSource = `#version 300 es
        precision mediump float;
        in vec2 vUv;
        out vec4 fragColor;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec2 uRes;

        float wave(vec2 p, float t) {
          float w1 = sin(p.x * 5.0 + t * 0.9 + cos(p.y * 3.2 - t * 0.55));
          float w2 = cos(p.y * 6.2 - t * 0.75 + sin(p.x * 3.8 + t * 0.45));
          float w3 = sin((p.x - p.y) * 4.1 + t * 0.65);
          return (w1 + w2 + w3) / 3.0;
        }

        void main() {
          vec2 uv = vUv;
          float aspect = uRes.x / max(1.0, uRes.y);
          vec2 p = vec2(uv.x * aspect, uv.y);
          vec2 m = vec2(uMouse.x * aspect, 1.0 - uMouse.y);

          float dist = length(p - m);
          float ripple = sin(dist * 16.0 - uTime * 2.8) * exp(-dist * 3.2) * 0.22;

          float h = wave(p + vec2(ripple * 0.4), uTime * 0.9);
          float caustic = pow(smoothstep(0.32, 0.96, h * 0.5 + 0.5 + ripple), 2.4);

          vec3 glintColor = mix(vec3(0.055, 0.420, 0.455), vec3(0.957, 0.918, 0.835), caustic);
          float alpha = caustic * 0.34 + exp(-dist * 4.5) * 0.14;
          fragColor = vec4(glintColor * alpha, alpha);
        }
      `;

      function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        return s;
      }

      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsSource));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsSource));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, "uTime");
      const uMouse = gl.getUniformLocation(prog, "uMouse");
      const uRes = gl.getUniformLocation(prog, "uRes");

      function resizeGL() {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        const w = canvas.clientWidth || 1280;
        const h = canvas.clientHeight || 720;
        if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
          canvas.width = Math.floor(w * dpr);
          canvas.height = Math.floor(h * dpr);
          gl.viewport(0, 0, canvas.width, canvas.height);
        }
      }

      const start = performance.now();
      function frame(now) {
        if (!canvas.isConnected) return;
        requestAnimationFrame(frame);
        if (!isVisible) return;
        resizeGL();
        smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.08;
        smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.08;
        gl.uniform1f(uTime, (now - start) * 0.001);
        gl.uniform2f(uMouse, smoothMouse.x, smoothMouse.y);
        gl.uniform2f(uRes, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }
      requestAnimationFrame(frame);
      return;
    }

    // Canvas 2D Fallback for Hero Shimmer
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const start2d = performance.now();
    function frame2d(now) {
      if (!canvas.isConnected) return;
      requestAnimationFrame(frame2d);
      if (!isVisible) return;
      const w = (canvas.width = canvas.clientWidth || 1280);
      const h = (canvas.height = canvas.clientHeight || 720);
      const t = (now - start2d) * 0.001;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(250, 246, 238, 0.16)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const baseY = h * (0.55 + i * 0.09);
        for (let x = 0; x <= w; x += 24) {
          const y = baseY + Math.sin(x * 0.008 + t + i) * 12;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
    requestAnimationFrame(frame2d);
  }

  function initMagnetic() {
    if (prefersReduced) return;
    document.querySelectorAll(".btn-magnetic").forEach((btn) => {
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.14;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.18;
        btn.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      btn.addEventListener("pointerleave", () => {
        btn.style.transform = "translate3d(0, 0, 0)";
      });
    });
  }

  function initScrollReveals(rootEl) {
    const scope = rootEl || document;
    const targets = scope.querySelectorAll("[data-reveal]:not(.is-revealed)");
    if (!targets.length) return;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let batchIdx = 0;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const customDelay = el.getAttribute("data-reveal-delay");
          const delayMs = customDelay ? Number(customDelay) : Math.min(batchIdx * 45, 220);
          batchIdx++;
          el.style.transitionDelay = `${delayMs}ms`;
          el.classList.add("is-revealed");
          observer.unobserve(el);
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px 40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));

    window.addEventListener(
      "scroll",
      () => {
        if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 40) {
          document.querySelectorAll("[data-reveal]:not(.is-revealed)").forEach((el) => {
            el.classList.add("is-revealed");
            observer.unobserve(el);
          });
        }
      },
      { passive: true }
    );
  }

  const dockLastBox = new WeakMap();
  let dockFontsHooked = false;
  let tidePulseTimer = null;

  function pulseTide() {
    if (prefersReduced) return;
    const tideEl = document.getElementById("suot-tide-transition");
    if (!tideEl) return;
    if (tidePulseTimer) clearTimeout(tidePulseTimer);
    tideEl.classList.remove("is-exiting", "is-entering");
    void tideEl.offsetWidth;
    tideEl.classList.add("is-exiting");
    tidePulseTimer = setTimeout(() => {
      tideEl.classList.remove("is-exiting");
      tideEl.classList.add("is-entering");
      tidePulseTimer = setTimeout(() => {
        tideEl.classList.remove("is-entering");
      }, 320);
    }, 105);
  }

  function positionDockGlidePill(dock, immediate) {
    if (!dock || !dock.isConnected) return;
    const activeBtn = dock.querySelector(
      ".catalog-dock-tab.active, .hero-island-btn.active, .featured-filter-btn.active"
    );
    let pill = dock.querySelector(":scope > .dock-glide-pill");

    if (!activeBtn) {
      if (pill) pill.style.opacity = "0";
      return;
    }

    if (!pill) {
      pill = document.createElement("span");
      pill.className = "dock-glide-pill";
      pill.setAttribute("aria-hidden", "true");
      dock.insertBefore(pill, dock.firstChild);

      const prev = dockLastBox.get(dock);
      if (prev && !immediate && !prefersReduced) {
        pill.style.transition = "none";
        pill.style.width = `${prev.width}px`;
        pill.style.height = `${prev.height}px`;
        pill.style.transform = `translate3d(${prev.left}px, ${prev.top}px, 0)`;
        pill.style.opacity = "1";
        void pill.offsetWidth;
      } else {
        immediate = true;
      }
    }

    const left = activeBtn.offsetLeft;
    const top = activeBtn.offsetTop;
    const width = activeBtn.offsetWidth;
    const height = activeBtn.offsetHeight;
    if (!width || !height) return;

    dockLastBox.set(dock, { left, top, width, height });

    if (immediate || prefersReduced) {
      pill.style.transition = "none";
      pill.style.width = `${width}px`;
      pill.style.height = `${height}px`;
      pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      pill.style.opacity = "1";
      void pill.offsetWidth;
      pill.style.transition = "";
      return;
    }

    pill.style.transition = "";
    pill.style.width = `${width}px`;
    pill.style.height = `${height}px`;
    pill.style.transform = `translate3d(${left}px, ${top}px, 0)`;
    pill.style.opacity = "1";
  }

  function initDockGliders(rootEl) {
    const scope = rootEl || document;
    const docks = scope.querySelectorAll(".catalog-hero-dock, .hero-island-switcher, .featured-filter-dock");
    docks.forEach((dock) => {
      dock.classList.add("has-dock-glider");
      positionDockGlidePill(dock, !dock.dataset.dockGlideBound);

      if (dock.dataset.dockGlideBound) return;
      dock.dataset.dockGlideBound = "1";

      const mutObs = new MutationObserver((mutations) => {
        const relevant = mutations.some((m) => {
          if (m.type === "childList") {
            const nodes = [...m.addedNodes, ...m.removedNodes];
            return !nodes.every((n) => n.nodeType === 1 && n.classList.contains("dock-glide-pill"));
          }
          return m.type === "attributes" && m.target !== dock && !m.target.classList.contains("dock-glide-pill");
        });
        if (!relevant) return;
        requestAnimationFrame(() => positionDockGlidePill(dock, false));
      });
      mutObs.observe(dock, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["class"]
      });

      if ("ResizeObserver" in window) {
        const ro = new ResizeObserver(() => {
          requestAnimationFrame(() => positionDockGlidePill(dock, true));
        });
        ro.observe(dock);
      }
    });

    if (!dockFontsHooked && document.fonts && document.fonts.ready) {
      dockFontsHooked = true;
      document.fonts.ready.then(() => {
        document
          .querySelectorAll(".catalog-hero-dock, .hero-island-switcher, .featured-filter-dock")
          .forEach((dock) => positionDockGlidePill(dock, true));
      });
    }
  }

  function initPageEffects() {
    initOceanCanvas();
    initMagnetic();
    initDockGliders();
    initScrollReveals();
  }

  window.SuotMotion = {
    initReveals: initScrollReveals,
    initDocks: initDockGliders,
    pulseTide,
    initPage: initPageEffects
  };

  window.suotTransition = function (updateFn) {
    if (typeof document.startViewTransition === "function" && !prefersReduced) {
      try {
        const vt = document.startViewTransition(updateFn);
        if (vt && vt.updateCallbackDone) vt.updateCallbackDone.catch(() => {});
        if (vt && vt.finished) vt.finished.catch(() => {});
        if (vt && vt.ready) vt.ready.catch(() => {});
        return vt;
      } catch (_) {}
    }
    updateFn();
    return null;
  };

  document.addEventListener("DOMContentLoaded", initPageEffects);
})();
