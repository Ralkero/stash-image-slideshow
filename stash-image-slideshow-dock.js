(function () {
  "use strict";

  var PANEL_SELECTOR = ".stash-slideshow-wave-player";
  var HEAD_SELECTOR = ".stash-slideshow-wave-head";
  var BUTTON_CLASS = "stash-slideshow-wave-collapse";
  var COLLAPSED_ATTRIBUTE = "data-stash-slideshow-collapsed";
  var STORAGE_KEY = "stash.imageSlideshow.audioPlayerCollapsed.v1";
  var VIEWPORT_MARGIN = 8;
  var scanQueued = false;
  var decoratedPanels = typeof WeakSet === "function" ? new WeakSet() : null;

  function readCollapsedPreference() {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === "true";
    } catch (_) {
      return false;
    }
  }

  function saveCollapsedPreference(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? "true" : "false");
    } catch (_) {}
  }

  var collapsed = readCollapsedPreference();

  function iconMarkup(isCollapsed) {
    return isCollapsed
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  function updateButton(button, isCollapsed) {
    var state = isCollapsed ? "collapsed" : "expanded";
    if (button.dataset.state !== state) {
      button.dataset.state = state;
      button.innerHTML = iconMarkup(isCollapsed);
      button.title = isCollapsed ? "Expand audio player" : "Collapse audio player";
      button.setAttribute("aria-label", button.title);
      button.setAttribute("aria-expanded", isCollapsed ? "false" : "true");
    }
  }

  function clamp(value, minimum, maximum) {
    return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
  }

  function clampPanelToViewport(panel) {
    if (!panel || panel.dataset.stashSlideshowDragged !== "true") return;
    var rect = panel.getBoundingClientRect();
    var maximumLeft = window.innerWidth - rect.width - VIEWPORT_MARGIN;
    var maximumTop = window.innerHeight - rect.height - VIEWPORT_MARGIN;
    panel.style.left = clamp(rect.left, VIEWPORT_MARGIN, maximumLeft) + "px";
    panel.style.top = clamp(rect.top, VIEWPORT_MARGIN, maximumTop) + "px";
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  function applyCollapsedState(panel, button, value) {
    var nextValue = value ? "true" : "false";
    if (panel.getAttribute(COLLAPSED_ATTRIBUTE) !== nextValue) {
      panel.setAttribute(COLLAPSED_ATTRIBUTE, nextValue);
    }
    updateButton(button, value);
    window.requestAnimationFrame(function () { clampPanelToViewport(panel); });
  }

  function createCollapseButton(panel) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON_CLASS;
    button.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      collapsed = !collapsed;
      saveCollapsedPreference(collapsed);
      document.querySelectorAll(PANEL_SELECTOR).forEach(function (currentPanel) {
        var currentButton = currentPanel.querySelector(":scope > ." + BUTTON_CLASS);
        if (currentButton) applyCollapsedState(currentPanel, currentButton, collapsed);
      });
    });
    panel.appendChild(button);
    return button;
  }

  function enableDragging(panel) {
    var head = panel.querySelector(HEAD_SELECTOR);
    if (!head) return;

    head.setAttribute("title", "Drag audio player");

    head.addEventListener("pointerdown", function (event) {
      if (event.button !== 0 || event.isPrimary === false) return;
      if (event.target.closest("button, a, input, select, textarea")) return;

      var startRect = panel.getBoundingClientRect();
      var startX = event.clientX;
      var startY = event.clientY;
      var pointerId = event.pointerId;

      event.preventDefault();
      panel.dataset.stashSlideshowDragging = "true";
      panel.dataset.stashSlideshowDragged = "true";

      try { head.setPointerCapture(pointerId); } catch (_) {}

      function move(moveEvent) {
        if (moveEvent.pointerId !== pointerId) return;
        var nextLeft = startRect.left + moveEvent.clientX - startX;
        var nextTop = startRect.top + moveEvent.clientY - startY;
        var maximumLeft = window.innerWidth - panel.offsetWidth - VIEWPORT_MARGIN;
        var maximumTop = window.innerHeight - panel.offsetHeight - VIEWPORT_MARGIN;

        panel.style.left = clamp(nextLeft, VIEWPORT_MARGIN, maximumLeft) + "px";
        panel.style.top = clamp(nextTop, VIEWPORT_MARGIN, maximumTop) + "px";
        panel.style.right = "auto";
        panel.style.bottom = "auto";
      }

      function finish(finishEvent) {
        if (finishEvent.pointerId !== pointerId) return;
        panel.dataset.stashSlideshowDragging = "false";
        head.removeEventListener("pointermove", move);
        head.removeEventListener("pointerup", finish);
        head.removeEventListener("pointercancel", finish);
        try { head.releasePointerCapture(pointerId); } catch (_) {}
        clampPanelToViewport(panel);
      }

      head.addEventListener("pointermove", move);
      head.addEventListener("pointerup", finish);
      head.addEventListener("pointercancel", finish);
    });

    if (typeof ResizeObserver === "function") {
      var resizeObserver = new ResizeObserver(function () {
        clampPanelToViewport(panel);
      });
      resizeObserver.observe(panel);
    }
  }

  function decoratePanel(panel) {
    var button = panel.querySelector(":scope > ." + BUTTON_CLASS);
    if (!button) button = createCollapseButton(panel);
    applyCollapsedState(panel, button, collapsed);

    if (!decoratedPanels || !decoratedPanels.has(panel)) {
      enableDragging(panel);
      if (decoratedPanels) decoratedPanels.add(panel);
    }
  }

  function scan() {
    scanQueued = false;
    document.querySelectorAll(PANEL_SELECTOR).forEach(decoratePanel);
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    window.requestAnimationFrame(scan);
  }

  var observer = new MutationObserver(queueScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("resize", function () {
    document.querySelectorAll(PANEL_SELECTOR).forEach(clampPanelToViewport);
  });
  queueScan();
})();