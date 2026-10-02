/* ==========================================================================
   INTLLM — Client-side minimal behavior
   Theme toggle, platform tabs, copy feedback, scrollspy, FAQ, and subtle reveal.
   Zero external dependencies. Extremely lightweight.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var THEME_KEY = "intllm-theme";

  /* ---- Theme Management -------------------------------------------------- */
  function getSystemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#000000" : "#FFFFFF");
    }
  }

  // Initialize theme
  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (e) { /* storage restricted */ }
  applyTheme(savedTheme || getSystemTheme());

  // Listen for system preference changes if user hasn't explicitly set one
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      } catch (err) {}
    });
  }

  // Theme toggle button click
  var themeToggle = doc.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme") || "light";
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {}
    });
  }

  /* ---- Header Scroll Border Transition ----------------------------------- */
  var header = doc.querySelector(".site-header");
  if (header) {
    var checkScroll = function () {
      if (window.scrollY > 16) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", checkScroll, { passive: true });
    checkScroll();
  }

  /* ---- Copy to Clipboard ------------------------------------------------- */
  function copyText(text, btn) {
    if (!text) return;
    var originalLabel = btn.innerHTML;

    function markCopied() {
      btn.classList.add("is-copied");
      btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg> Copied';
      btn.setAttribute("aria-label", "Copied to clipboard");
      setTimeout(function () {
        btn.classList.remove("is-copied");
        btn.innerHTML = originalLabel;
        btn.removeAttribute("aria-label");
      }, 1600);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(markCopied, function () {
        fallbackCopy(text);
        markCopied();
      });
    } else {
      fallbackCopy(text);
      markCopied();
    }
  }

  function fallbackCopy(text) {
    var ta = doc.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";
    doc.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      doc.execCommand("copy");
    } catch (e) {}
    doc.body.removeChild(ta);
  }

  doc.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-copy]");
    if (!btn) return;
    var targetSelector = btn.getAttribute("data-copy");
    var target = targetSelector ? doc.querySelector(targetSelector) : null;
    var text = target ? (target.textContent || "").trim() : btn.getAttribute("data-copy-text");
    copyText(text, btn);
  });

  /* ---- Platform Tabs in Terminal Widget ---------------------------------- */
  var platformTabs = doc.querySelectorAll(".terminal-tab");
  var terminalCode = doc.querySelector("#install-cmd");
  var terminalPrompt = doc.querySelector("#install-prompt");
  var terminalPlatformNote = doc.querySelector("#terminal-platform-note");

  var platformData = {
    windows: {
      prompt: "$",
      cmd: "irm https://intllm.vercel.app/install.ps1 | iex",
      note: 'Windows 10/11 x64 · Or <a href="/download">Download Setup.exe</a>'
    },
    macos: {
      prompt: "$",
      cmd: "curl -fsSL https://intllm.vercel.app/install.sh | bash",
      note: 'macOS 12+ (Apple Silicon & Intel) · Universal shell installer'
    },
    linux: {
      prompt: "$",
      cmd: "curl -fsSL https://intllm.vercel.app/install.sh | bash",
      note: 'Linux x64/arm64 · Universal shell installer or pip install intllm'
    }
  };

  platformTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      platformTabs.forEach(function (t) { t.classList.remove("is-active"); });
      tab.classList.add("is-active");
      var os = tab.getAttribute("data-os");
      if (platformData[os] && terminalCode) {
        terminalCode.textContent = platformData[os].cmd;
        if (terminalPrompt) terminalPrompt.textContent = platformData[os].prompt;
        if (terminalPlatformNote) terminalPlatformNote.innerHTML = platformData[os].note;
      }
    });
  });

  /* ---- Scrollspy for Documentation Page (/info) --------------------------- */
  var docLinks = doc.querySelectorAll(".doc-nav-link");
  var docSections = doc.querySelectorAll(".doc-section");
  if (docLinks.length && docSections.length && window.IntersectionObserver) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            docLinks.forEach(function (link) {
              if (link.getAttribute("href") === "#" + id) {
                link.classList.add("is-active");
              } else {
                link.classList.remove("is-active");
              }
            });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    docSections.forEach(function (sec) { observer.observe(sec); });
  }

  /* ---- FAQ Accordion Toggle ---------------------------------------------- */
  doc.querySelectorAll(".faq-question").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      if (item) {
        item.classList.toggle("is-open");
      }
    });
  });

  /* ---- Subtle Reveal on Scroll ------------------------------------------- */
  var reveals = doc.querySelectorAll(".reveal-up");
  if (reveals.length && window.IntersectionObserver) {
    var revealObserver = new IntersectionObserver(
      function (entries, self) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            self.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-revealed"); });
  }
})();
