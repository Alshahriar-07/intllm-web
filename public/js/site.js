/* ==========================================================================
   INTLLM website — shared behavior
   Theme toggle (prefers-color-scheme aware), copy buttons, install tabs.
   No dependencies. ~150 lines.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;

  /* ---- Theme ------------------------------------------------------------- */
  var THEME_KEY = "intllm-theme";

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#050505" : "#ffffff");
  }

  applyTheme(
    root.hasAttribute("data-theme")
      ? root.getAttribute("data-theme")
      : (function () {
          var stored = null;
          try { stored = localStorage.getItem(THEME_KEY); } catch (e) { /* storage unavailable */ }
          return stored === "dark" || stored === "light" ? stored : systemTheme();
        })()
  );

  var toggle = doc.querySelector(".theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
    });
  }

  /* ---- Copy buttons -------------------------------------------------------- */
  function fallbackCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    doc.body.appendChild(ta);
    ta.select();
    try { doc.execCommand("copy"); } catch (e) { /* clipboard blocked */ }
    doc.body.removeChild(ta);
  }

  doc.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var targetSel = btn.getAttribute("data-copy");
      var target = targetSel ? doc.querySelector(targetSel) : null;
      var text = target ? (target.textContent || "").trim() : "";
      if (!text) return;

      var label = btn.textContent;

      function done() {
        btn.classList.add("is-copied");
        btn.textContent = "Copied";
        btn.setAttribute("aria-label", "Copied to clipboard");
        window.setTimeout(function () {
          btn.classList.remove("is-copied");
          btn.textContent = label;
          btn.removeAttribute("aria-label");
        }, 1600);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {
          fallbackCopy(text);
          done();
        });
      } else {
        fallbackCopy(text);
        done();
      }
    });
  });

  /* ---- Install tabs (ARIA pattern, arrow-key navigation) --------------------- */
  var tablist = doc.querySelector("[role='tablist']");
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll("[role='tab']"));
    var panels = tabs.map(function (tab) {
      return doc.getElementById(tab.getAttribute("aria-controls"));
    });

    function selectTab(tab, focus) {
      tabs.forEach(function (t, i) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.tabIndex = selected ? 0 : -1;
        if (panels[i]) panels[i].hidden = !selected;
      });
      if (focus) tab.focus();
      if (history.replaceState) {
        var id = tab.id.replace(/^tab-/, "");
        history.replaceState(null, "", "#" + id);
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { selectTab(tab, false); });
      tab.addEventListener("keydown", function (e) {
        var dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        selectTab(tabs[(i + dir + tabs.length) % tabs.length], true);
      });
    });

    var initial = window.location.hash.replace("#", "");
    var target = tabs.filter(function (t) {
      return t.id === "tab-" + initial;
    })[0];
    if (target) selectTab(target, false);
  }
})();
