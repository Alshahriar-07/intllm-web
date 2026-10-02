/* ==========================================================================
   INTLLM — Minimalist Client Runtime Behavior
   Strict Black + White + Ash design system.
   Features:
   - Theme toggle (pure light/dark)
   - Intro boot sequence (initial load)
   - Hero sequential reveal
   - Platform controls & typed command animation
   - Functional monochrome clipboard copy
   - Smooth page transitions
   - Documentation scrollspy & FAQ
   Zero external dependencies. Fast, robust, accessible.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var THEME_KEY = "intllm-theme";
  var BOOT_KEY = "intllm-boot-seen";

  /* ---- 1. Theme Management ----------------------------------------------- */
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

  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem(THEME_KEY);
  } catch (e) {}
  applyTheme(savedTheme || getSystemTheme());

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      try {
        if (!localStorage.getItem(THEME_KEY)) {
          applyTheme(e.matches ? "dark" : "light");
        }
      } catch (err) {}
    });
  }

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

  /* ---- 2. Page Transition System ----------------------------------------- */
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initPageTransitions() {
    // Intercept internal navigation for subtle page fade transition
    doc.addEventListener("click", function (e) {
      var link = e.target.closest("a");
      if (!link) return;
      var href = link.getAttribute("href");
      if (!href) return;

      // Ignore external, target=_blank, hash-only, or file downloads
      if (
        link.target === "_blank" ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey ||
        href.startsWith("#") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:") ||
        href.endsWith(".exe") ||
        href.endsWith(".ps1") ||
        href.endsWith(".sh") ||
        href.endsWith(".md") ||
        href.endsWith(".xml") ||
        href.endsWith(".txt")
      ) {
        return;
      }

      // Check if it's a relative path on same origin
      if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
        if (prefersReducedMotion) return;
        e.preventDefault();
        doc.body.classList.add("is-transitioning-out");
        setTimeout(function () {
          window.location.href = href;
        }, 220);
      }
    });

    // Handle pageshow for bfcache restoration
    window.addEventListener("pageshow", function (e) {
      doc.body.classList.remove("is-transitioning-out");
      doc.body.classList.add("is-page-ready");
    });
  }

  /* ---- 3. Intro Boot Experience ------------------------------------------ */
  function initIntro() {
    var introEl = doc.getElementById("site-intro");
    if (!introEl) {
      doc.body.classList.add("is-page-ready");
      startHeroSequence();
      return;
    }

    var hasBooted = false;
    try {
      hasBooted = sessionStorage.getItem(BOOT_KEY) === "true";
    } catch (e) {}

    // If already booted this session or reduced motion preferred, dismiss intro swiftly
    if (hasBooted || prefersReducedMotion) {
      introEl.parentNode && introEl.parentNode.removeChild(introEl);
      doc.body.classList.add("is-page-ready");
      startHeroSequence();
      return;
    }

    // Play cinematic intro sequence
    try {
      sessionStorage.setItem(BOOT_KEY, "true");
    } catch (e) {}

    introEl.classList.add("is-playing");

    setTimeout(function () {
      introEl.classList.add("is-revealing");
    }, 400);

    setTimeout(function () {
      introEl.classList.add("is-leaving");
      doc.body.classList.add("is-page-ready");
      startHeroSequence();
    }, 1100);

    setTimeout(function () {
      if (introEl.parentNode) {
        introEl.parentNode.removeChild(introEl);
      }
    }, 1450);
  }

  /* ---- 4. Hero Sequential Reveal ----------------------------------------- */
  function startHeroSequence() {
    var heroItems = doc.querySelectorAll(".reveal-hero");
    if (!heroItems.length) return;

    if (prefersReducedMotion) {
      heroItems.forEach(function (el) { el.classList.add("is-revealed"); });
      typeTerminalCommand();
      return;
    }

    heroItems.forEach(function (el, idx) {
      setTimeout(function () {
        el.classList.add("is-revealed");
        // Start terminal typing when terminal reaches reveal
        if (el.classList.contains("terminal-box") || idx === heroItems.length - 1) {
          typeTerminalCommand();
        }
      }, 80 + idx * 90);
    });
  }

  /* ---- 5. Platform Controls & Typing Terminal ---------------------------- */
  var platformData = {
    windows: {
      name: "Windows",
      prompt: ">",
      cmd: "irm https://intllm.vercel.app/install.ps1 | iex",
      indicator: "PowerShell · Windows 10/11 x64",
      note: 'Windows 10/11 x64 · Or <a href="/download">Download Setup.exe</a>'
    },
    macos: {
      name: "macOS",
      prompt: "$",
      cmd: "curl -fsSL https://intllm.vercel.app/install.sh | bash",
      indicator: "zsh / bash · macOS 12+ (Apple Silicon & Intel)",
      note: 'macOS universal shell installer · Homebrew / pip compatible'
    },
    linux: {
      name: "Linux",
      prompt: "$",
      cmd: "curl -fsSL https://intllm.vercel.app/install.sh | bash",
      indicator: "bash · Linux x64 & arm64",
      note: 'Linux universal installer · pip install intllm supported'
    }
  };

  var currentOS = "windows";
  var typingTimeout = null;

  function typeTerminalCommand() {
    var cmdEl = doc.getElementById("install-cmd");
    var cursorEl = doc.getElementById("install-cursor");
    if (!cmdEl) return;

    var fullText = (platformData[currentOS] && platformData[currentOS].cmd) || "irm https://intllm.vercel.app/install.ps1 | iex";

    if (prefersReducedMotion) {
      cmdEl.textContent = fullText;
      if (cursorEl) cursorEl.style.opacity = "0";
      return;
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    cmdEl.textContent = "";
    if (cursorEl) {
      cursorEl.style.opacity = "1";
      cursorEl.classList.add("is-typing");
    }

    var idx = 0;
    var speed = Math.max(14, Math.min(22, Math.floor(950 / fullText.length)));

    function step() {
      if (idx < fullText.length) {
        cmdEl.textContent += fullText.charAt(idx);
        idx++;
        typingTimeout = setTimeout(step, speed);
      } else {
        // Typing finished
        if (cursorEl) {
          cursorEl.classList.remove("is-typing");
          setTimeout(function () {
            cursorEl.style.opacity = "0";
          }, 800);
        }
      }
    }

    step();
  }

  function setPlatform(osKey) {
    if (!platformData[osKey]) return;
    currentOS = osKey;

    // Update active platform buttons
    var allPlatformButtons = doc.querySelectorAll("[data-os]");
    allPlatformButtons.forEach(function (btn) {
      if (btn.getAttribute("data-os") === osKey) {
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");
      } else {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-selected", "false");
      }
    });

    // Update terminal indicators
    var promptEl = doc.getElementById("install-prompt");
    var indicatorEl = doc.getElementById("terminal-os-indicator");
    var noteEl = doc.getElementById("terminal-platform-note");

    if (promptEl) promptEl.textContent = platformData[osKey].prompt;
    if (indicatorEl) indicatorEl.textContent = platformData[osKey].indicator;
    if (noteEl) noteEl.innerHTML = platformData[osKey].note;

    // Type the new command
    typeTerminalCommand();
  }

  // Handle platform button / tab clicks
  doc.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-os]");
    if (!btn) return;
    var os = btn.getAttribute("data-os");
    if (os) {
      setPlatform(os);
    }
  });

  /* ---- 6. Monochrome Copy to Clipboard ----------------------------------- */
  function copyText(text, btn) {
    if (!text) return;
    var labelEl = btn.querySelector(".copy-label") || btn.querySelector("span:not(.arrow)");
    var originalLabel = labelEl ? labelEl.textContent : btn.textContent;

    function markCopied() {
      btn.classList.add("is-copied");
      if (labelEl) {
        labelEl.textContent = "Copied";
      } else {
        btn.textContent = "Copied";
      }
      btn.setAttribute("aria-label", "Copied to clipboard");

      setTimeout(function () {
        btn.classList.remove("is-copied");
        if (labelEl) {
          labelEl.textContent = originalLabel;
        } else {
          btn.textContent = originalLabel;
        }
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

  /* ---- 7. Header Scroll Transition --------------------------------------- */
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

  /* ---- 8. Scrollspy for Documentation Page (/info) ----------------------- */
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

  /* ---- 9. FAQ Accordion Toggle ------------------------------------------- */
  doc.querySelectorAll(".faq-question").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".faq-item");
      if (item) {
        item.classList.toggle("is-open");
      }
    });
  });

  /* ---- 10. Subtle Scroll Entrance Observer ------------------------------- */
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
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) { revealObserver.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-revealed"); });
  }

  /* ---- Initialize on DOM Ready ------------------------------------------- */
  initPageTransitions();
  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initIntro);
  } else {
    initIntro();
  }
})();
