(function () {
  "use strict";

  var PLUGIN_VERSION = "0.4.3";
  var PLAYER_SELECTOR = ".stash-slideshow-player";
  var AUDIO_PANEL_SELECTOR = ".stash-slideshow-wave-player";
  var SETTINGS_ATTRIBUTE = "data-stash-slideshow-hotkey-settings";
  var STORAGE_KEY = "stash.imageSlideshow.hotkeys.v1";
  var LEGACY_CODES = ["ArrowLeft", "ArrowRight", "Space", "KeyK", "KeyM"];
  var DEFAULT_CONFIG = {
    mode: "linked",
    slideshow: {
      previous: "ArrowLeft",
      next: "ArrowRight",
      toggle: "Space"
    },
    audio: {
      rewind: "KeyJ",
      forward: "KeyL",
      toggle: "KeyM"
    }
  };

  var ACTIONS = [
    { id: "slideshow.previous", group: "Slideshow", label: "Previous image" },
    { id: "slideshow.next", group: "Slideshow", label: "Next image" },
    { id: "slideshow.toggle", group: "Slideshow", label: "Play / pause" },
    { id: "audio.rewind", group: "Audio", label: "Rewind 10 seconds" },
    { id: "audio.forward", group: "Audio", label: "Forward 10 seconds" },
    { id: "audio.toggle", group: "Audio", label: "Play / pause" }
  ];

  var config = loadConfig();
  var capture = null;
  var scanQueued = false;

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }

  function sanitizeBinding(value, fallback) {
    var text = typeof value === "string" ? value.trim() : "";
    return text || fallback;
  }

  function sanitizeConfig(value) {
    var input = value && typeof value === "object" ? value : {};
    var defaults = cloneDefaults();
    return {
      mode: input.mode === "separate" ? "separate" : "linked",
      slideshow: {
        previous: sanitizeBinding(input.slideshow && input.slideshow.previous, defaults.slideshow.previous),
        next: sanitizeBinding(input.slideshow && input.slideshow.next, defaults.slideshow.next),
        toggle: sanitizeBinding(input.slideshow && input.slideshow.toggle, defaults.slideshow.toggle)
      },
      audio: {
        rewind: sanitizeBinding(input.audio && input.audio.rewind, defaults.audio.rewind),
        forward: sanitizeBinding(input.audio && input.audio.forward, defaults.audio.forward),
        toggle: sanitizeBinding(input.audio && input.audio.toggle, defaults.audio.toggle)
      }
    };
  }

  function loadConfig() {
    try {
      var stored = window.localStorage.getItem(STORAGE_KEY);
      return sanitizeConfig(stored ? JSON.parse(stored) : null);
    } catch (_) {
      return cloneDefaults();
    }
  }

  function saveConfig(next) {
    config = sanitizeConfig(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (_) {}
    renderAllSettings();
  }

  function getActionBinding(actionId) {
    var parts = actionId.split(".");
    return config[parts[0]][parts[1]];
  }

  function setActionBinding(actionId, binding) {
    var next = sanitizeConfig(config);
    var parts = actionId.split(".");
    next[parts[0]][parts[1]] = binding;
    saveConfig(next);
  }

  function isModifierCode(code) {
    return ["ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "MetaLeft", "MetaRight"].indexOf(code) !== -1;
  }

  function bindingFromEvent(event) {
    if (!event.code || isModifierCode(event.code)) return "";
    var parts = [];
    if (event.ctrlKey) parts.push("Control");
    if (event.altKey) parts.push("Alt");
    if (event.shiftKey) parts.push("Shift");
    if (event.metaKey) parts.push("Meta");
    parts.push(event.code);
    return parts.join("+");
  }

  function displayCode(code) {
    var labels = {
      ArrowLeft: "←",
      ArrowRight: "→",
      ArrowUp: "↑",
      ArrowDown: "↓",
      Space: "Space",
      Enter: "Enter",
      Escape: "Esc",
      Backspace: "Backspace",
      Delete: "Delete",
      Tab: "Tab"
    };
    if (labels[code]) return labels[code];
    if (/^Key[A-Z]$/.test(code)) return code.slice(3);
    if (/^Digit[0-9]$/.test(code)) return code.slice(5);
    if (/^Numpad[0-9]$/.test(code)) return "Num " + code.slice(6);
    return code.replace(/Left$|Right$/, "");
  }

  function displayBinding(binding) {
    return String(binding || "").split("+").map(function (part) {
      if (part === "Control") return "Ctrl";
      if (part === "Meta") return "Meta";
      return displayCode(part);
    }).join(" + ");
  }

  function bindingUsedByAnother(actionId, binding) {
    return ACTIONS.some(function (action) {
      return action.id !== actionId && getActionBinding(action.id) === binding;
    });
  }

  function eventTargetIsEditable(event) {
    var target = event.target;
    if (!target || target.nodeType !== 1) return false;
    return !!target.closest("input, select, textarea, button, [contenteditable='true']");
  }

  function stopHotkeyEvent(event) {
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
  }

  function getPlayer() {
    return document.querySelector(PLAYER_SELECTOR);
  }

  function getSlideshowToggleButton(player) {
    return player && player.querySelector(".stash-slideshow-controls button.primary");
  }

  function slideshowIsPlaying(player) {
    var button = getSlideshowToggleButton(player);
    var text = button ? String(button.getAttribute("title") || button.getAttribute("aria-label") || "") : "";
    return /^pause/i.test(text);
  }

  function setSlideshowPlaying(player, shouldPlay) {
    var button = getSlideshowToggleButton(player);
    if (!button) return;
    if (slideshowIsPlaying(player) !== shouldPlay) button.click();
  }

  function moveSlideshow(player, direction) {
    var selector = direction < 0 ? ".stash-slideshow-hit.previous" : ".stash-slideshow-hit.next";
    var button = player && player.querySelector(selector);
    if (button) button.click();
  }

  function getAudioElement(player) {
    return player && player.querySelector("audio.stash-slideshow-background-media");
  }

  function setAudioPlaying(media, shouldPlay) {
    if (!media) return;
    if (shouldPlay && media.paused) {
      var result = media.play();
      if (result && typeof result.catch === "function") result.catch(function () {});
    } else if (!shouldPlay && !media.paused) {
      media.pause();
    }
  }

  function toggleAudio(media) {
    if (!media) return;
    setAudioPlaying(media, media.paused);
  }

  function seekAudio(media, seconds) {
    if (!media) return;
    var duration = Number.isFinite(media.duration) ? media.duration : Number.MAX_SAFE_INTEGER;
    media.currentTime = Math.max(0, Math.min(duration, (Number(media.currentTime) || 0) + seconds));
  }

  function syncPlayPause(player) {
    var media = getAudioElement(player);
    if (!media) {
      setSlideshowPlaying(player, !slideshowIsPlaying(player));
      return;
    }
    var shouldPlay = !(slideshowIsPlaying(player) && !media.paused);
    setSlideshowPlaying(player, shouldPlay);
    setAudioPlaying(media, shouldPlay);
  }

  function runAction(actionId, player, repeated) {
    var media = getAudioElement(player);
    if ((actionId === "slideshow.toggle" || actionId === "audio.toggle") && repeated) return;
    if (actionId === "slideshow.previous") moveSlideshow(player, -1);
    if (actionId === "slideshow.next") moveSlideshow(player, 1);
    if (actionId === "slideshow.toggle") setSlideshowPlaying(player, !slideshowIsPlaying(player));
    if (actionId === "audio.rewind") seekAudio(media, -10);
    if (actionId === "audio.forward") seekAudio(media, 10);
    if (actionId === "audio.toggle") toggleAudio(media);
  }

  function handleLinkedHotkey(event, binding, player) {
    var media = getAudioElement(player);
    if (binding === "ArrowLeft") {
      moveSlideshow(player, -1);
      seekAudio(media, -10);
      return true;
    }
    if (binding === "ArrowRight") {
      moveSlideshow(player, 1);
      seekAudio(media, 10);
      return true;
    }
    if (binding === "Space" || binding === "KeyK") {
      if (!event.repeat) syncPlayPause(player);
      return true;
    }
    if (binding === "KeyM") {
      if (!event.repeat) toggleAudio(media);
      return true;
    }
    return false;
  }

  function handleSeparateHotkey(event, binding, player) {
    var matched = ACTIONS.find(function (action) {
      return getActionBinding(action.id) === binding;
    });
    if (matched) {
      runAction(matched.id, player, event.repeat);
      return true;
    }

    // Prevent the original slideshow listener from continuing to use its
    // hard-coded legacy bindings after the user enables separate mode.
    return LEGACY_CODES.indexOf(binding) !== -1;
  }

  function updateCaptureMessage(message, isError) {
    if (!capture || !capture.section) return;
    var status = capture.section.querySelector(".stash-slideshow-hotkey-status");
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", !!isError);
  }

  function finishCapture(cancelled) {
    if (!capture) return;
    var button = capture.button;
    if (button) {
      button.classList.remove("is-capturing");
      button.textContent = displayBinding(getActionBinding(capture.actionId));
    }
    if (cancelled) updateCaptureMessage("Hotkey change cancelled.", false);
    capture = null;
  }

  function handleCapture(event) {
    stopHotkeyEvent(event);
    if (event.code === "Escape") {
      finishCapture(true);
      return;
    }
    var binding = bindingFromEvent(event);
    if (!binding) return;
    if (bindingUsedByAnother(capture.actionId, binding)) {
      updateCaptureMessage(displayBinding(binding) + " is already assigned to another action.", true);
      return;
    }
    var actionId = capture.actionId;
    finishCapture(false);
    setActionBinding(actionId, binding);
  }

  function handleKeydown(event) {
    if (capture) {
      handleCapture(event);
      return;
    }

    var player = getPlayer();
    if (!player || eventTargetIsEditable(event)) return;
    var binding = bindingFromEvent(event);
    if (!binding) return;

    var handled = config.mode === "linked"
      ? handleLinkedHotkey(event, binding, player)
      : handleSeparateHotkey(event, binding, player);

    if (handled) stopHotkeyEvent(event);
  }

  function createModeControl(section) {
    var label = document.createElement("label");
    label.className = "stash-slideshow-hotkey-mode";
    var text = document.createElement("span");
    text.textContent = "Control mode";
    var select = document.createElement("select");
    select.innerHTML = '<option value="linked">Linked: slideshow and audio together</option><option value="separate">Separate configurable hotkeys</option>';
    select.value = config.mode;
    select.addEventListener("change", function () {
      var next = sanitizeConfig(config);
      next.mode = select.value === "separate" ? "separate" : "linked";
      saveConfig(next);
    });
    label.appendChild(text);
    label.appendChild(select);
    section.appendChild(label);
  }

  function startCapture(action, button, section) {
    if (capture) finishCapture(true);
    capture = { actionId: action.id, button: button, section: section };
    button.classList.add("is-capturing");
    button.textContent = "Press a key…";
    updateCaptureMessage("Press the new key or key combination. Press Esc to cancel.", false);
  }

  function createSeparateBindings(section) {
    var grid = document.createElement("div");
    grid.className = "stash-slideshow-hotkey-grid";
    var currentGroup = "";

    ACTIONS.forEach(function (action) {
      if (action.group !== currentGroup) {
        currentGroup = action.group;
        var heading = document.createElement("strong");
        heading.className = "stash-slideshow-hotkey-group";
        heading.textContent = currentGroup;
        grid.appendChild(heading);
      }

      var row = document.createElement("div");
      row.className = "stash-slideshow-hotkey-row";
      var label = document.createElement("span");
      label.textContent = action.label;
      var button = document.createElement("button");
      button.type = "button";
      button.className = "stash-slideshow-hotkey-binding";
      button.textContent = displayBinding(getActionBinding(action.id));
      button.addEventListener("click", function () { startCapture(action, button, section); });
      row.appendChild(label);
      row.appendChild(button);
      grid.appendChild(row);
    });

    section.appendChild(grid);

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "stash-slideshow-hotkey-reset";
    reset.textContent = "Reset separate hotkeys";
    reset.addEventListener("click", function () {
      var next = cloneDefaults();
      next.mode = "separate";
      saveConfig(next);
    });
    section.appendChild(reset);
  }

  function createLinkedSummary(section) {
    var summary = document.createElement("div");
    summary.className = "stash-slideshow-hotkey-summary";
    summary.innerHTML = "<strong>Linked controls</strong><span><kbd>←</kbd>/<kbd>→</kbd> changes the image and skips audio 10 seconds.</span><span><kbd>Space</kbd> or <kbd>K</kbd> synchronizes slideshow and audio play/pause.</span><span><kbd>M</kbd> controls audio only.</span>";
    section.appendChild(summary);
  }

  function renderSettingsSection(section) {
    if (capture && capture.section === section) capture = null;
    section.replaceChildren();

    var heading = document.createElement("div");
    heading.className = "stash-slideshow-hotkey-heading";
    var title = document.createElement("h3");
    title.textContent = "Hotkeys";
    var description = document.createElement("small");
    description.textContent = "Choose whether transport shortcuts control both players or use independent bindings.";
    heading.appendChild(title);
    heading.appendChild(description);
    section.appendChild(heading);

    createModeControl(section);
    if (config.mode === "separate") createSeparateBindings(section);
    else createLinkedSummary(section);

    var status = document.createElement("small");
    status.className = "stash-slideshow-hotkey-status";
    status.setAttribute("aria-live", "polite");
    section.appendChild(status);
  }

  function createSettingsSection(container) {
    var section = document.createElement("section");
    section.className = "stash-slideshow-hotkey-settings";
    section.setAttribute(SETTINGS_ATTRIBUTE, "true");
    renderSettingsSection(section);

    var anchor = container.querySelector(".stash-slideshow-shortcuts, .stash-slideshow-start");
    if (anchor) container.insertBefore(section, anchor);
    else container.appendChild(section);
    return section;
  }

  function decorateSettingsContainer(container) {
    if (!container.querySelector("[" + SETTINGS_ATTRIBUTE + "]")) createSettingsSection(container);
  }

  function renderAllSettings() {
    document.querySelectorAll("[" + SETTINGS_ATTRIBUTE + "]").forEach(renderSettingsSection);
  }

  function decorateAudioPanel(panel) {
    if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
    if (panel.dataset.stashSlideshowHotkeyFocusBound === "true") return;
    panel.dataset.stashSlideshowHotkeyFocusBound = "true";
    panel.addEventListener("pointerdown", function (event) {
      var target = event.target;
      if (target && target.nodeType === 1 && target.closest("button, input, select, a")) return;
      try { panel.focus({ preventScroll: true }); } catch (_) { panel.focus(); }
    });
  }

  function applyRuntimeVersion() {
    if (window.StashImageSlideshow) window.StashImageSlideshow.version = PLUGIN_VERSION;
    document.querySelectorAll(".stash-slideshow-version").forEach(function (element) {
      element.textContent = "v" + PLUGIN_VERSION;
    });
  }

  function scan() {
    scanQueued = false;
    applyRuntimeVersion();
    document.querySelectorAll(".stash-slideshow-settings, .stash-slideshow-live-settings").forEach(decorateSettingsContainer);
    document.querySelectorAll(AUDIO_PANEL_SELECTOR).forEach(decorateAudioPanel);
  }

  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    window.requestAnimationFrame(scan);
  }

  window.addEventListener("keydown", handleKeydown, true);
  new MutationObserver(queueScan).observe(document.documentElement, { childList: true, subtree: true });

  window.StashImageSlideshowHotkeys = {
    version: PLUGIN_VERSION,
    getConfig: function () { return sanitizeConfig(config); },
    setMode: function (mode) {
      var next = sanitizeConfig(config);
      next.mode = mode === "separate" ? "separate" : "linked";
      saveConfig(next);
    },
    reset: function () { saveConfig(cloneDefaults()); },
    _test: {
      sanitizeConfig: sanitizeConfig,
      bindingFromEvent: bindingFromEvent,
      displayBinding: displayBinding
    }
  };

  queueScan();
})();