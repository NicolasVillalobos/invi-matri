/* =========================================================
   Nicolás y Perla — lógica del sitio
   Sin dependencias: modales, countdown, carrusel y Supabase
   ========================================================= */
(function () {
  "use strict";

  var CFG = window.APP_CONFIG || {};
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------------------------------------------------------
     Supabase — inserciones vía API REST (sin SDK)
     --------------------------------------------------------- */
  var supabase = {
    configured: function () {
      return typeof CFG.SUPABASE_URL === "string" &&
             CFG.SUPABASE_URL.indexOf("TU-PROYECTO") === -1 &&
             typeof CFG.SUPABASE_ANON_KEY === "string" &&
             CFG.SUPABASE_ANON_KEY.indexOf("TU_ANON_KEY") === -1;
    },
    insert: function (table, row) {
      if (!this.configured()) {
        return Promise.reject(new Error("Supabase no está configurado. Revisa js/config.js"));
      }
      return fetch(CFG.SUPABASE_URL.replace(/\/+$/, "") + "/rest/v1/" + table, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": CFG.SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + CFG.SUPABASE_ANON_KEY,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify(row)
      }).then(function (res) {
        if (res.ok) return true;
        return res.text().then(function (txt) {
          throw new Error("Supabase " + res.status + ": " + txt);
        });
      });
    }
  };

  /* ---------------------------------------------------------
     Modales
     --------------------------------------------------------- */
  var lastFocused = null;

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return;
    lastFocused = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    var focusable = $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", modal)
      .filter(function (el) { return el.offsetParent !== null; });
    var first = focusable.find(function (el) { return !el.hasAttribute("data-modal-close"); }) || focusable[0];
    if (first) first.focus({ preventScroll: true });
    modal.__focusable = focusable;
  }

  function closeModal(modal) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-modal-open]");
    if (opener) { openModal(opener.getAttribute("data-modal-open")); return; }

    var closer = e.target.closest("[data-modal-close]");
    if (closer) { closeModal(closer.closest(".modal")); return; }
  });

  document.addEventListener("keydown", function (e) {
    var open = $$(".modal").find(function (m) { return !m.hidden; });
    if (!open) return;
    if (e.key === "Escape") { closeModal(open); return; }
    if (e.key === "Tab") {
      var f = $$("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])", open)
        .filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var firstEl = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });

  /* ---------------------------------------------------------
     Cuenta regresiva
     --------------------------------------------------------- */
  (function countdown() {
    var root = $("#countdown");
    if (!root) return;
    var target = new Date(CFG.WEDDING_DATE || "2026-12-12T17:30:00-03:00").getTime();
    var cells = {};
    $$("[data-unit]", root).forEach(function (el) { cells[el.getAttribute("data-unit")] = el; });

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        Object.keys(cells).forEach(function (k) { cells[k].textContent = "00"; });
        return;
      }
      var s = Math.floor(diff / 1000);
      cells.days.textContent    = String(Math.floor(s / 86400));
      cells.hours.textContent   = pad(Math.floor(s % 86400 / 3600));
      cells.minutes.textContent = pad(Math.floor(s % 3600 / 60));
      cells.seconds.textContent = pad(s % 60);
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------------------------------------------------------
     Carrusel
     --------------------------------------------------------- */
  $$("[data-carousel]").forEach(function (carousel) {
    var viewport = $("[data-carousel-viewport]", carousel);
    var dotsBox  = $("[data-carousel-dots]", carousel);
    var slides   = $$(".carousel__slide", viewport);
    if (!slides.length) return;

    function index() { return Math.round(viewport.scrollLeft / viewport.clientWidth); }

    /* Tween propio en vez de scrollTo({behavior:"smooth"}) o
       `scroll-behavior: smooth`: combinados con `scroll-snap-type: mandatory`
       hay navegadores donde el desplazamiento simplemente no ocurre. Escribir
       scrollLeft cuadro a cuadro funciona en todos. */
    var anim = null;
    function goTo(i) {
      var n = Math.max(0, Math.min(slides.length - 1, i));
      var to = n * viewport.clientWidth;
      var from = viewport.scrollLeft;
      if (anim) cancelAnimationFrame(anim);
      if (from === to) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        viewport.scrollLeft = to;
        sync();
        return;
      }
      var start = performance.now();
      var dur = 320;
      // Red de seguridad: en una pestaña en segundo plano o con ahorro de
      // energía, requestAnimationFrame no corre y la foto no cambiaría nunca.
      var bail = setTimeout(function () {
        if (anim) { cancelAnimationFrame(anim); anim = null; }
        viewport.scrollLeft = to;
        sync();
      }, dur + 150);

      (function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3);           // ease-out cúbico
        viewport.scrollLeft = from + (to - from) * e;
        if (t < 1) { anim = requestAnimationFrame(step); }
        else { anim = null; clearTimeout(bail); sync(); }
      })(start);
    }

    var dots = slides.map(function (_, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "carousel__dot";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", "Foto " + (i + 1) + " de " + slides.length);
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () { goTo(i); });
      dotsBox.appendChild(b);
      return b;
    });

    var prev = $("[data-carousel-prev]", carousel);
    var next = $("[data-carousel-next]", carousel);
    if (prev) prev.addEventListener("click", function () { goTo(index() - 1); });
    if (next) next.addEventListener("click", function () { goTo(index() + 1); });

    carousel.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); goTo(index() - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(index() + 1); }
    });

    function sync() {
      var idx = index();
      dots.forEach(function (d, i) { d.setAttribute("aria-selected", i === idx ? "true" : "false"); });
      if (prev) prev.disabled = idx === 0;
      if (next) next.disabled = idx === slides.length - 1;
    }

    var raf;
    viewport.addEventListener("scroll", function () {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);
    }, { passive: true });
    sync();
  });

  /* ---------------------------------------------------------
     Formularios
     --------------------------------------------------------- */
  function setStatus(form, msg, ok) {
    var el = $("[data-form-status]", form);
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle("form__status--ok", !!ok);
  }

  function showThanks(form, title, text) {
    form.innerHTML =
      '<h2 class="modal__title">' + title + '</h2>' +
      '<p class="modal__text" style="text-align:center">' + text + '</p>' +
      '<button class="btn btn--coral btn--block" type="button" data-modal-close>Cerrar</button>';
    form.classList.add("form--done");
  }

  function submitting(form, on) {
    var btn = $("button[type=submit]", form);
    if (btn) { btn.disabled = on; btn.dataset.label = btn.dataset.label || btn.textContent; btn.textContent = on ? "Enviando…" : btn.dataset.label; }
  }

  /* --- RSVP --- */
  var formRsvp = $("#form-rsvp");
  if (formRsvp) {
    var extra = $("[data-rsvp-extra]", formRsvp);

    formRsvp.addEventListener("change", function (e) {
      if (e.target.name !== "asiste") return;
      var asiste = e.target.value === "si";
      extra.hidden = !asiste;
      if (!asiste) {
        $$("input[name=preferencia]", extra).forEach(function (r) { r.checked = false; });
        $("#rsvp-alergias").value = "";
      }
    });

    formRsvp.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(formRsvp);
      var nombre = (data.get("nombre") || "").toString().trim();
      var asiste = data.get("asiste");

      if (!nombre) { setStatus(formRsvp, "Por favor escribe tu nombre completo."); $("#rsvp-nombre").focus(); return; }
      if (!asiste) { setStatus(formRsvp, "Indícanos si nos acompañas."); return; }

      var row = {
        nombre: nombre,
        asiste: asiste === "si",
        preferencia_alimentaria: asiste === "si" ? (data.get("preferencia") || null) : null,
        alergias: asiste === "si" ? ((data.get("alergias") || "").toString().trim() || null) : null,
        mensaje: (data.get("mensaje") || "").toString().trim() || null
      };

      setStatus(formRsvp, "");
      submitting(formRsvp, true);

      supabase.insert("rsvps", row)
        .then(function () {
          if (row.asiste) {
            showThanks(formRsvp, "¡Gracias!", "Tu confirmación quedó registrada. ¡Nos vemos el 12 de diciembre!");
          } else {
            showThanks(formRsvp, "Gracias por avisar", "Lamentamos que no puedas acompañarnos. ¡Te mandamos un abrazo!");
          }
        })
        .catch(function (err) {
          console.error(err);
          submitting(formRsvp, false);
          setStatus(formRsvp, "No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo.");
        });
    });
  }

  /* --- Sugerir canción --- */
  var formCancion = $("#form-cancion");
  if (formCancion) {
    formCancion.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(formCancion);
      var cancion = (data.get("cancion") || "").toString().trim();
      var enlace  = (data.get("enlace") || "").toString().trim();

      if (!cancion) { setStatus(formCancion, "Escribe el nombre de la canción."); $("#cancion-nombre").focus(); return; }
      if (enlace && !/^https?:\/\//i.test(enlace)) { setStatus(formCancion, "El enlace debe empezar con http:// o https://"); return; }

      setStatus(formCancion, "");
      submitting(formCancion, true);

      supabase.insert("canciones", { cancion: cancion, enlace: enlace || null })
        .then(function () {
          showThanks(formCancion, "¡Anotada!", "Gracias por tu sugerencia, sonará en la fiesta.");
        })
        .catch(function (err) {
          console.error(err);
          submitting(formCancion, false);
          setStatus(formCancion, "No pudimos guardar tu sugerencia. Inténtalo de nuevo.");
        });
    });
  }

})();
