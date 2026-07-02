/* ==========================================================================
   MANADA — Prototipo · interacciones de demo (JS vanilla, sin dependencias)
   ========================================================================== */
(function () {
  "use strict";

  /* ---- Contador de carrito (persistente entre páginas con localStorage) ---- */
  var CART_KEY = "manada_cart_count";
  function getCart() {
    var v = parseInt(localStorage.getItem(CART_KEY), 10);
    return isNaN(v) ? 2 : v; // demo arranca con 2 productos
  }
  function setCart(n) {
    localStorage.setItem(CART_KEY, String(n));
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.style.display = n > 0 ? "" : "none";
    });
  }
  function bumpCart(el) {
    setCart(getCart() + 1);
    document.querySelectorAll("[data-cart-count]").forEach(function (c) {
      c.classList.remove("bounce");
      // reflow para reiniciar la animación
      void c.offsetWidth;
      c.classList.add("bounce");
    });
  }

  /* ---- Agregar al carrito ---- */
  document.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add-cart]");
    if (add) {
      e.preventDefault();
      bumpCart(add);
      var label = add.getAttribute("data-added-label") || "Agregado ✓";
      var prev = add.dataset._prev;
      if (prev === undefined) {
        add.dataset._prev = add.innerHTML;
        add.innerHTML = label;
        setTimeout(function () {
          add.innerHTML = add.dataset._prev;
          delete add.dataset._prev;
        }, 1400);
      }
    }
  });

  /* ---- Toggles (suscripción, etc.) ---- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest(".toggle");
    if (!t) return;
    t.classList.toggle("on");
    t.setAttribute("aria-checked", t.classList.contains("on") ? "true" : "false");
    var targetSel = t.getAttribute("data-reveal");
    if (targetSel) {
      document.querySelectorAll(targetSel).forEach(function (el) {
        el.hidden = !t.classList.contains("on");
      });
    }
  });
  // toggle accesible por teclado
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.classList && e.target.classList.contains("toggle")) {
      e.preventDefault();
      e.target.click();
    }
  });

  /* ---- Tabs ---- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var btns = group.querySelectorAll("[data-tab]");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-tab");
        btns.forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        group.parentNode.querySelectorAll("[data-panel]").forEach(function (p) {
          p.hidden = p.getAttribute("data-panel") !== id;
        });
      });
    });
  });

  /* ---- Chips de filtro (toggle visual) ---- */
  document.addEventListener("click", function (e) {
    var chip = e.target.closest(".chip[data-toggle-chip]");
    if (!chip) return;
    chip.classList.toggle("chip--active");
  });

  /* ---- Selector de mascota (demo: solo feedback visual) ---- */
  document.addEventListener("click", function (e) {
    var sw = e.target.closest("[data-pet-switch]");
    if (!sw) return;
    sw.classList.add("pulse");
    setTimeout(function () { sw.classList.remove("pulse"); }, 1300);
  });

  /* ---- Drawer / sheet genérico (carrito, filtros) ---- */
  function openOverlay(el) {
    el.hidden = false;
    requestAnimationFrame(function () { el.classList.add("is-open"); });
    document.body.style.overflow = "hidden";
  }
  function closeOverlay(el) {
    el.classList.remove("is-open");
    document.body.style.overflow = "";
    setTimeout(function () { el.hidden = true; }, 320);
  }
  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open]");
    if (opener) {
      var target = document.querySelector(opener.getAttribute("data-open"));
      if (target) { e.preventDefault(); openOverlay(target); return; }
    }
    var closer = e.target.closest("[data-close]");
    if (closer) {
      var ov = closer.closest(".overlay");
      if (ov) { closeOverlay(ov); return; }
    }
    // clic en backdrop
    if (e.target.classList && e.target.classList.contains("overlay__backdrop")) {
      closeOverlay(e.target.closest(".overlay"));
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".overlay.is-open").forEach(closeOverlay);
    }
  });

  /* ---- Qty steppers ---- */
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-qty]");
    if (!btn) return;
    var wrap = btn.closest(".qty");
    var out = wrap.querySelector("[data-qty-val]");
    var n = parseInt(out.textContent, 10) || 1;
    n += btn.getAttribute("data-qty") === "inc" ? 1 : -1;
    if (n < 1) n = 1;
    out.textContent = n;
  });

  /* ---- Selección entre radio-cards / frecuencia ---- */
  document.querySelectorAll("[data-radio-group]").forEach(function (group) {
    group.addEventListener("click", function (e) {
      var card = e.target.closest(".radio-card");
      if (!card || !group.contains(card)) return;
      group.querySelectorAll(".radio-card").forEach(function (c) { c.classList.remove("sel"); });
      card.classList.add("sel");
      var radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  /* ---- Init ---- */
  setCart(getCart());
})();
