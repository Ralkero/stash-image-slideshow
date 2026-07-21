(function () {
  "use strict";

  var PANEL_SELECTOR = ".stash-slideshow-wave-player";
  var BUTTON_CLASS = "stash-slideshow-wave-collapse";
  var COLLAPSED_ATTRIBUTE = "data-stash-slideshow-collapsed";
  var STORAGE_KEY = "stash.imageSlideshow.audioPlayerCollapsed.v1";
  var scanQueued = false;

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

  function applyCollapsedState(panel, button, value) {
    var nextValue = value ? "true" : "false";
    if (panel.getAttribute(COLLAPSED_ATTRIBUTE) !== nextValue) {
      panel.setAttribute(COLLAPSED_ATTRIBUTE, nextValue);
    }
    updateButton(button, value);
  }

  function createCollapseButton(panel) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = BUTTON_CLASS;
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

  function decoratePanel(panel) {
    var button = panel.querySelector(":scope > ." + BUTTON_CLASS);
    if (!button) button = createCollapseButton(panel);
    applyCollapsedState(panel, button, collapsed);
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
  queueScan();
})();