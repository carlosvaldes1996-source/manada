/* ==========================================================================
   MANADA — Componentes de chrome reutilizables (Web Components, JS vanilla)
   Única fuente de verdad para header, footer y bottom-nav.
   Funciona offline / file:// (sin fetch ni build). Uso:
     <manada-header page="comprar"></manada-header>   (page: home|comprar|pdp|mascota|carrito)
     <manada-header variant="checkout"></manada-header>
     <manada-footer></manada-footer>
     <manada-botnav page="home"></manada-botnav>
   ========================================================================== */
(function () {
  "use strict";

  function paw(color) {
    return (
      '<svg class="logo__mark" viewBox="0 0 32 32" aria-hidden="true">' +
      '<circle cx="9" cy="11" r="3.2" fill="' + color + '"/>' +
      '<circle cx="16" cy="8.5" r="3.4" fill="' + color + '"/>' +
      '<circle cx="23" cy="11" r="3.2" fill="' + color + '"/>' +
      '<path d="M16 14c4.2 0 7.5 3 7.5 6.4 0 2.8-2.7 4.6-7.5 4.6S8.5 23.2 8.5 20.4C8.5 17 11.8 14 16 14Z" fill="' + color + '"/>' +
      "</svg>"
    );
  }
  var on = function (cond) { return cond ? " active" : ""; };

  /* ----- <manada-header> ----- */
  class ManadaHeader extends HTMLElement {
    connectedCallback() {
      var page = this.getAttribute("page") || "";
      var logo =
        '<a href="index.html" class="logo" aria-label="Manada — inicio">' + paw("#C2603F") + " Manada</a>";

      if (this.getAttribute("variant") === "checkout") {
        this.innerHTML =
          '<header class="header"><div class="container header__inner">' +
          logo +
          '<div class="header__actions">' +
          '<span class="badge badge--success" aria-hidden="true">🔒 Pago seguro</span>' +
          '<a class="icon-btn" href="carrito.html" aria-label="Volver al carrito">🛒<span class="cart-count" data-cart-count>2</span></a>' +
          "</div></div></header>";
        return;
      }

      this.innerHTML =
        '<header class="header">' +
        '<div class="container header__inner">' +
        logo +
        '<button class="search" type="button" aria-label="Buscar productos">🔍 <span>Buscar alimento, accesorios, farmacia…</span></button>' +
        '<div class="header__actions">' +
        '<button class="pet-switch" type="button" data-pet-switch aria-label="Mascota activa: Toby. Cambiar"><span class="pet-switch__avatar" aria-hidden="true">🐶</span> Toby</button>' +
        '<a class="icon-btn" href="mascota.html" aria-label="Mi cuenta">👤</a>' +
        '<a class="icon-btn" href="carrito.html" aria-label="Carrito de compras">🛒<span class="cart-count" data-cart-count>2</span></a>' +
        "</div></div>" +
        '<nav class="navbar" aria-label="Navegación principal"><div class="container"><ul>' +
        '<li class="has-mega"><a href="plp.html" class="' + (page === "comprar" ? "active" : "").trim() + '" aria-haspopup="true">Comprar ▾</a>' +
        '<div class="mega">' +
        "<div><h5>Por mascota</h5><a href=\"plp.html\">Perro</a><a href=\"plp.html\">Gato</a><a href=\"plp.html\">Otros</a></div>" +
        "<div><h5>Alimento</h5><a href=\"plp.html\">Seco</a><a href=\"plp.html\">Húmedo</a><a href=\"plp.html\">Medicado</a><a href=\"plp.html\">Por edad / etapa</a></div>" +
        "<div><h5>Más</h5><a href=\"plp.html\">Accesorios</a><a href=\"plp.html\">Farmacia 🔒</a><a href=\"plp.html\">Marcas</a><a href=\"plp.html\">Ofertas</a></div>" +
        "</div></li>" +
        '<li><a href="plp.html" class="' + (page === "comprar" || page === "pdp" ? "active" : "").trim() + '">Alimento</a></li>' +
        '<li><a href="plp.html">Accesorios</a></li>' +
        '<li><a href="plp.html">Farmacia <span class="lock">🔒</span></a></li>' +
        '<li><a href="mascota.html" class="' + (page === "mascota" ? "active" : "").trim() + '">Mi recompra</a></li>' +
        '<li><a href="plp.html">Ofertas</a></li>' +
        "</ul></div></nav></header>";
    }
  }

  /* ----- <manada-footer> ----- */
  class ManadaFooter extends HTMLElement {
    connectedCallback() {
      this.innerHTML =
        '<footer class="footer"><div class="container"><div class="footer__inner">' +
        '<div class="footer__brand">' +
        '<a href="index.html" class="logo">' + paw("#fff") + " Manada</a>" +
        '<p class="body-s mt-12" style="color:var(--neutral-400); max-width:34ch;">Te conoce como nadie y se anticipa a lo que tu mascota necesita. 🐾</p>' +
        "</div>" +
        '<div><h4>Comprar</h4><a href="plp.html">Alimento</a><a href="plp.html">Accesorios</a><a href="plp.html">Farmacia</a><a href="plp.html">Ofertas</a></div>' +
        '<div><h4>Manada</h4><a href="mascota.html">Mis mascotas</a><a href="mascota.html">Mi recompra</a><a href="carrito.html">Carrito</a><a href="#">Boletas SII</a></div>' +
        '<div><h4>Ayuda</h4><a href="#">Despacho y cobertura</a><a href="#">Devoluciones</a><a href="#">Contacto</a><a href="#">Términos</a></div>' +
        "</div>" +
        '<div class="footer__bottom row between wrap gap-8"><span>© 2026 Manada · tumanada.cl · Hecho con 💛 en Chile</span><span>Webpay · MercadoPago · Khipu</span></div>' +
        "</div></footer>";
    }
  }

  /* ----- <manada-botnav> ----- */
  class ManadaBotnav extends HTMLElement {
    connectedCallback() {
      var page = this.getAttribute("page") || "";
      var cur = function (cond) { return cond ? ' class="active" aria-current="page"' : ""; };
      this.innerHTML =
        '<nav class="botnav" aria-label="Navegación móvil">' +
        '<a href="index.html"' + cur(page === "home") + '><span class="ic" aria-hidden="true">🏠</span>Inicio</a>' +
        '<a href="plp.html"' + cur(page === "comprar" || page === "pdp") + '><span class="ic" aria-hidden="true">🛍️</span>Comprar</a>' +
        '<a href="plp.html"><span class="ic" aria-hidden="true">🔍</span>Buscar</a>' +
        '<a href="mascota.html"' + cur(page === "mascota") + '><span class="ic" aria-hidden="true">🐾</span>Mascotas</a>' +
        '<a href="carrito.html"' + cur(page === "carrito") + '><span class="ic" aria-hidden="true">🛒</span>Carrito</a>' +
        "</nav>";
    }
  }

  customElements.define("manada-header", ManadaHeader);
  customElements.define("manada-footer", ManadaFooter);
  customElements.define("manada-botnav", ManadaBotnav);
})();
