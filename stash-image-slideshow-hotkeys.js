(function () {
  "use strict";

  var PLUGIN_VERSION = "0.4.4";
  var PLAYER_SELECTOR = ".stash-slideshow-player";
  var AUDIO_PANEL_SELECTOR = ".stash-slideshow-wave-player";
  var SETTINGS_ATTRIBUTE = "data-stash-slideshow-hotkey-settings";
  var STORAGE_KEY = "stash.imageSlideshow.hotkeys.v1";
  var LEGACY_CODES = ["ArrowLeft", "ArrowRight", "Space", "KeyK", "KeyM"];
  var MODIFIERS = ["Shift", "Control", "Alt", "Meta"];
  var DEFAULT_CONFIG = {
    linkedModifier: "Shift",
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
    { id: "slideshow.previous", group: "Slideshow", label: "Previous image", linked: "previous" },
    { id: "slideshow.next", group: "Slideshow", label: "Next image", linked: "next" },
    { id: "slideshow.toggle", group: "Slideshow", label: "Play / pause", linked: "toggle" },
    { id: "audio.rewind", group: "Audio", label: "Rewind 10 seconds", linked: "previous" },
    { id: "audio.forward", group: "Audio", label: "Forward 10 seconds", linked: "next" },
    { id: "audio.toggle", group: "Audio", label: "Play / pause", linked: "toggle" }
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
      linkedModifier: MODIFIERS.indexOf(input.linkedModifier) !== -1 ? input.linkedModifier : defaults.linkedModifier,
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

  function bindingContainsModifier(binding, modifier) {
    return String(binding || "").split("+").indexOf(modifier) !== -1;
  }

  function removeModifier(binding, modifier) {
    return String(binding || "").split("+").filter(function (part) {
      return part !== modifier;
    }).join("+");
  }

  function modifierActive(event, modifier) {
    if (modifier === "Shift") return event.shiftKey;
    if (modifier === "Control") return event.ctrlKey;
    if (modifier === "Alt") return event.altKey;
    if (modifier === "Meta") return event.metaKey;
    return false;
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

  function getActionForBinding(binding) {
    var matched = ACTIONS.find(function (action) {
      return getActionBinding(action.id) === binding;
    });
    if (matched) return matched;
    if (binding === "KeyK" && config.slideshow.toggle === "Space") {
      return ACTIONS.find(function (action) { return action.id === "slideshow.toggle"; });
    }
    return null;
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
    if (button && slideshowIsPlaying(player) !== shouldPlay) button.click();
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
    if (media) setAudioPlaying(media, media.paused);
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

  function runSeparateAction(actionId, player, repeated) {
    var media = getAudioElement(player);
    if ((actionId === "slideshow.toggle" || actionId === "audio.toggle") && repeated) return;
    if (actionId === "slideshow.previous") moveSlideshow(player, -1);
    if (actionId === "slideshow.next") moveSlideshow(player, 1);
    if (actionId === "slideshow.toggle") setSlideshowPlaying(player, !slideshowIsPlaying(player));
    if (actionId === "audio.rewind") seekAudio(media, -10);
    if (actionId === "audio.forward") seekAudio(media, 10);
    if (actionId === "audio.toggle") toggleAudio(media);
  }

  function runLinkedAction(kind, player, repeated) {
    var media = getAudioElement(player);
    if (kind === "toggle" && repeated) return;
    if (kind === "previous") {
      moveSlideshow(player, -1);
      seekAudio(media, -10);
    }
    if (kind === "next") {
      moveSlideshow(player, 1);
      seekAudio(media, 10);
    }
    if (kind === "toggle") syncPlayPause(player);
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

    if (modifierActive(event, config.linkedModifier)) {
      var baseBinding = removeModifier(binding, config.linkedModifier);
      var linkedAction = getActionForBinding(baseBinding);
      if (linkedAction) {
        runLinkedAction(linkedAction.linked, player, event.repeat);
        stopHotkeyEvent(event);
      }
      return;
    }

    var action = getActionForBinding(binding);
    if (action) {
      runSeparateAction(action.id, player, event.repeat);
      stopHotkeyEvent(event);
      return;
    }

    if (LEGACY_CODES.indexOf(binding) !== -1) stopHotkeyEvent(event);
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
    if (bindingContainsModifier(binding, config.linkedModifier)) {
      updateCaptureMessage(displayBinding(binding) + " uses the linked modifier. Choose an unmodified separate-control key.", true);
      return;
    }
    if (bindingUsedByAnother(capture.actionId, binding)) {
      updateCaptureMessage(displayBinding(binding) + " is already assigned to another separate action.", true);
      return;
    }
    var actionId = capture.actionId;
    finishCapture(false);
    setActionBinding(actionId, binding);
  }

  function startCapture(action, button, section) {
    if (capture) finishCapture(true);
    capture = { actionId: action.id, button: button, section: section };
    button.classList.add("is-capturing");
    button.textContent = "Press a key…";
    updateCaptureMessage("Press an unmodified key or key combination. Press Esc to cancel.", false);
  }

  function appendKbd(parent, binding) {
    var kbd = document.createElement("kbd");
    kbd.textContent = displayBinding(binding);
    parent.appendChild(kbd);
  }

  function createModifierControl(body, section) {
    var label = document.createElement("label");
    label.className = "stash-slideshow-hotkey-mode";
    var text = document.createElement("span");
    text.textContent = "Linked-control modifier";
    var select = document.createElement("select");
    MODIFIERS.forEach(function (modifier) {
      var option = document.createElement("option");
      option.value = modifier;
      option.textContent = modifier === "Control" ? "Ctrl" : modifier;
      select.appendChild(option);
    });
    select.value = config.linkedModifier;
    select.addEventListener("change", function () {
      var nextModifier = select.value;
      var conflict = ACTIONS.find(function (action) {
        return bindingContainsModifier(getActionBinding(action.id), nextModifier);
      });
      if (conflict) {
        select.value = config.linkedModifier;
        var status = section.querySelector(".stash-slideshow-hotkey-status");
        if (status) {
          status.textContent = "That modifier is already part of the " + conflict.label.toLowerCase() + " binding.";
          status.classList.add("is-error");
        }
        return;
      }
      var next = sanitizeConfig(config);
      next.linkedModifier = nextModifier;
      saveConfig(next);
    });
    label.appendChild(text);
    label.appendChild(select);
    body.appendChild(label);
  }

  function createLinkedPreview(body) {
    var preview = document.createElement("div");
    preview.className = "stash-slideshow-hotkey-summary";
    var heading = document.createElement("strong");
    heading.textContent = "Linked controls";
    preview.appendChild(heading);

    [
      { first: "slideshow.previous", second: "audio.rewind", text: "previous image + rewind audio 10 seconds" },
      { first: "slideshow.next", second: "audio.forward", text: "next image + forward audio 10 seconds" },
      { first: "slideshow.toggle", second: "audio.toggle", text: "synchronize slideshow and audio play/pause" }
    ].forEach(function (item) {
      var row = document.createElement("span");
      appendKbd(row, config.linkedModifier + "+" + getActionBinding(item.first));
      row.appendChild(document.createTextNode(" or "));
      appendKbd(row, config.linkedModifier + "+" + getActionBinding(item.second));
      row.appendChild(document.createTextNode(" — " + item.text));
      preview.appendChild(row);
    });

    var note = document.createElement("small");
    note.textContent = "Without the modifier, every binding controls only its separate slideshow or audio action.";
    preview.appendChild(note);
    body.appendChild(preview);
  }

  function createBindingGrid(body, section) {
    var grid = document.createElement("div");
    grid.className = "stash-slideshow-hotkey-grid";
    var currentGroup = "";

    ACTIONS.forEach(function (action) {
      if (action.group !== currentGroup) {
        currentGroup = action.group;
        var heading = document.createElement("strong");
        heading.className = "stash-slideshow-hotkey-group";
        heading.textContent = currentGroup + " — separate controls";
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

    body.appendChild(grid);
  }

  function renderSettingsSection(section) {
    if (capture && capture.section === section) capture = null;
    var wasOpen = section.open;
    section.replaceChildren();

    var summary = document.createElement("summary");
    summary.className = "stash-slideshow-hotkey-menu-summary";
    var title = document.createElement("span");
    title.textContent = "Hotkey controls";
    var current = document.createElement("small");
    current.textContent = "Linked modifier: " + (config.linkedModifier === "Control" ? "Ctrl" : config.linkedModifier);
    summary.appendChild(title);
    summary.appendChild(current);
    section.appendChild(summary);

    var body = document.createElement("div");
    body.className = "stash-slideshow-hotkey-menu-body";
    var description = document.createElement("p");
    description.textContent = "Use unmodified bindings for separate slideshow or audio control. Hold the linked modifier with any matching transport key to control both together.";
    body.appendChild(description);
    createModifierControl(body, section);
    createLinkedPreview(body);
    createBindingGrid(body, section);

    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "stash-slideshow-hotkey-reset";
    reset.textContent = "Reset all hotkeys";
    reset.addEventListener("click", function () { saveConfig(cloneDefaults()); });
    body.appendChild(reset);

    var status = document.createElement("small");
    status.className = "stash-slideshow-hotkey-status";
    status.setAttribute("aria-live", "polite");
    body.appendChild(status);
    section.appendChild(body);
    section.open = wasOpen;
  }

  function createSettingsSection(container) {
    var section = document.createElement("details");
    section.className = "stash-slideshow-hotkey-settings";
    section.setAttribute(SETTINGS_ATTRIBUTE, "true");
    section.open = container.classList.contains("stash-slideshow-settings");
    renderSettingsSection(section);

    var anchor = container.querySelector(".stash-slideshow-shortcuts, .stash-slideshow-start");
    if (anchor) container.insertBefore(section, anchor);
    else container.appendChild(section);
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
    setLinkedModifier: function (modifier) {
      var next = sanitizeConfig(config);
      next.linkedModifier = MODIFIERS.indexOf(modifier) !== -1 ? modifier : DEFAULT_CONFIG.linkedModifier;
      saveConfig(next);
    },
    reset: function () { saveConfig(cloneDefaults()); },
    _test: {
      sanitizeConfig: sanitizeConfig,
      bindingFromEvent: bindingFromEvent,
      displayBinding: displayBinding,
      removeModifier: removeModifier
    }
  };

  queueScan();
})();
