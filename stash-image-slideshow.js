(function () {
  "use strict";

  var PLUGIN_ID = "stash-image-slideshow";
  var VERSION = "0.4.0";
  var ROUTE = "/plugins/image-slideshow";
  var OPTIONS_KEY = "stash.imageSlideshow.options.v1";
  var PENDING_KEY = "stash.imageSlideshow.pending.v1";
  var React;
  var h;

  var DEFAULT_OPTIONS = {
    displaySeconds: 5,
    transition: "fade",
    transitionSeconds: 0.65,
    fit: "contain",
    background: "#090b10",
    loop: true,
    shuffle: false,
    showCaptions: true,
    preload: true,
    backgroundClip: null,
    backgroundVolume: 0.65,
    backgroundLoop: true,
    sort: "path",
    direction: "ASC"
  };

  var icons = {
    slideshow: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 8.1 16 11.6l-6.5 3.7z" fill="currentColor"/><path d="M8 22h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    previous: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zm6 0h4v14h-4z" fill="currentColor"/></svg>',
    rewind: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8V4m0 0h4M4 4l3.2 3.2A7 7 0 1 1 5.3 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="8.2" y="15.2" fill="currentColor" font-size="8" font-family="sans-serif" font-weight="700">10</text></svg>',
    forward: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 8V4m0 0h-4m4-0-3.2 3.2A7 7 0 1 0 18.7 14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="6.5" y="15.2" fill="currentColor" font-size="8" font-family="sans-serif" font-weight="700">10</text></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6m2-8a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z" fill="currentColor"/><path d="m17 10 4 4m0-4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    repeat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3m13-2v2a3 3 0 0 1-3 3H4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><text x="9.1" y="15" fill="currentColor" font-size="7" font-family="sans-serif" font-weight="700">1</text></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m19 13.5 1.5 1.2-1.8 3-1.9-.7a8 8 0 0 1-2.3 1.3l-.3 2h-3.5l-.3-2A8 8 0 0 1 8.1 17l-1.9.7-1.8-3L6 13.5a8 8 0 0 1 0-2.7L4.4 9.6l1.8-3 1.9.7A8 8 0 0 1 10.4 6l.3-2h3.5l.3 2a8 8 0 0 1 2.3 1.3l1.9-.7 1.8 3-1.5 1.2a8 8 0 0 1 0 2.7Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="18" r="3" fill="currentColor"/><circle cx="16" cy="16" r="3" fill="currentColor"/></svg>',
    external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 13v6H5V6h6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function icon(name, className) {
    return h("span", {
      className: className || "stash-slideshow-icon",
      dangerouslySetInnerHTML: { __html: icons[name] || "" }
    });
  }

  function clampNumber(value, minimum, maximum, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
  }

  function sanitizeOptions(value) {
    var input = value && typeof value === "object" ? value : {};
    var transitions = ["none", "fade", "slide", "zoom"];
    var fits = ["contain", "cover", "native"];
    var sorts = ["path", "title", "date", "created_at", "random"];
    return {
      displaySeconds: clampNumber(input.displaySeconds, 1, 60, DEFAULT_OPTIONS.displaySeconds),
      transition: transitions.indexOf(input.transition) !== -1 ? input.transition : DEFAULT_OPTIONS.transition,
      transitionSeconds: clampNumber(input.transitionSeconds, 0, 3, DEFAULT_OPTIONS.transitionSeconds),
      fit: fits.indexOf(input.fit) !== -1 ? input.fit : DEFAULT_OPTIONS.fit,
      background: /^#[0-9a-f]{6}$/i.test(String(input.background || "")) ? input.background : DEFAULT_OPTIONS.background,
      loop: input.loop === undefined ? DEFAULT_OPTIONS.loop : !!input.loop,
      shuffle: input.shuffle === undefined ? DEFAULT_OPTIONS.shuffle : !!input.shuffle,
      showCaptions: input.showCaptions === undefined ? DEFAULT_OPTIONS.showCaptions : !!input.showCaptions,
      preload: input.preload === undefined ? DEFAULT_OPTIONS.preload : !!input.preload,
      backgroundClip: sanitizeBackgroundClip(input.backgroundClip),
      backgroundVolume: clampNumber(input.backgroundVolume, 0, 1, DEFAULT_OPTIONS.backgroundVolume),
      backgroundLoop: input.backgroundLoop === undefined ? DEFAULT_OPTIONS.backgroundLoop : !!input.backgroundLoop,
      sort: sorts.indexOf(input.sort) !== -1 ? input.sort : DEFAULT_OPTIONS.sort,
      direction: input.direction === "DESC" ? "DESC" : "ASC"
    };
  }

  function sanitizeBackgroundClip(value) {
    if (!value || typeof value !== "object" || !value.id || !value.stream) return null;
    return {
      id: String(value.id),
      label: String(value.label || "Background clip"),
      stream: String(value.stream),
      screenshot: value.screenshot ? String(value.screenshot) : "",
      duration: clampNumber(value.duration, 0, 86400, 0),
      kind: value.kind === "audio" ? "audio" : "scene"
    };
  }

  function formatMediaTime(value) {
    var total = Math.max(0, Math.floor(Number(value) || 0));
    var hours = Math.floor(total / 3600);
    var minutes = Math.floor((total % 3600) / 60);
    var seconds = total % 60;
    if (hours) return hours + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    return minutes + ":" + String(seconds).padStart(2, "0");
  }

  var activeWaveformControllers = typeof WeakMap === "function" ? new WeakMap() : null;

  function classifyMediaError(media, error) {
    var code = media && media.error ? Number(media.error.code) : 0;
    var name = error && error.name ? String(error.name) : "";
    var detail = error && error.message ? String(error.message) : "";
    if (code === 4 || name === "NotSupportedError") {
      return { kind: "unsupported", message: "This audio format is not supported by the browser." };
    }
    if (name === "NotAllowedError") {
      return { kind: "blocked", message: "Press play once to allow background audio." };
    }
    if (code === 2) return { kind: "error", message: "The audio could not be loaded because of a network error." };
    if (code === 3) return { kind: "error", message: "The browser could not decode this audio file." };
    if (code === 1) return { kind: "error", message: "Audio playback was aborted." };
    return { kind: "error", message: detail ? "Audio playback failed: " + detail : "Audio playback failed." };
  }

  function seekMediaBy(media, seconds, fallbackDuration) {
    if (!media) return 0;
    var duration = Number.isFinite(media.duration) ? media.duration : Number(fallbackDuration) || 0;
    media.currentTime = clampNumber((Number(media.currentTime) || 0) + Number(seconds || 0), 0, duration, 0);
    return media.currentTime;
  }

  function setMediaPlaybackRate(media, value) {
    var rate = clampNumber(value, 0.5, 2, 1);
    if (media) media.playbackRate = rate;
    return rate;
  }

  function createWaveformController(config) {
    var media = config && config.media;
    var container = config && config.container;
    var timelineContainer = config && config.timelineContainer;
    var source = config && config.source;
    var vendor = config && config.vendor;
    var onState = typeof config.onState === "function" ? config.onState : function () {};
    var onDuration = typeof config.onDuration === "function" ? config.onDuration : function () {};
    var oldController = activeWaveformControllers && media ? activeWaveformControllers.get(media) : null;
    if (oldController) oldController.destroy();

    var waveSurfer = null;
    var unsubscribers = [];
    var mediaListeners = [];
    var destroyed = false;
    var ready = false;
    var failed = false;

    function emit(state) {
      if (!destroyed) onState(state);
    }

    function addMediaListener(eventName, listener) {
      media.addEventListener(eventName, listener);
      mediaListeners.push([eventName, listener]);
    }

    var controller = {
      get instance() { return waveSurfer; },
      destroy: function () {
        if (destroyed) return;
        destroyed = true;
        unsubscribers.splice(0).forEach(function (unsubscribe) {
          try { unsubscribe(); } catch (_) {}
        });
        mediaListeners.splice(0).forEach(function (entry) {
          try { media.removeEventListener(entry[0], entry[1]); } catch (_) {}
        });
        if (waveSurfer) {
          try { waveSurfer.destroy(); } catch (_) {}
          waveSurfer = null;
        }
        if (activeWaveformControllers && activeWaveformControllers.get(media) === controller) {
          activeWaveformControllers.delete(media);
        }
      }
    };

    function fail(error) {
      if (destroyed || failed) return;
      failed = true;
      if (config.logErrors !== false && window.console && typeof window.console.warn === "function") {
        window.console.warn("[Native Image Slideshow] WaveSurfer fallback:", error);
      }
      var mediaFailure = classifyMediaError(media, error);
      var isMediaFailure = !!(media && media.error);
      emit(isMediaFailure ? mediaFailure : {
        kind: "fallback",
        message: "Waveform unavailable. Using the browser audio controls instead."
      });
      controller.destroy();
    }

    try {
      if (!media || !container || !timelineContainer || !source) throw new Error("Waveform player is missing its audio source or container.");
      if (!vendor || typeof vendor.create !== "function" || !vendor.Timeline || !vendor.Hover) {
        throw new Error("WaveSurfer.js or its required plugins did not load.");
      }

      var timeline = vendor.Timeline.create({
        container: timelineContainer,
        height: 18,
        formatTimeCallback: formatMediaTime,
        style: { color: "#8e9aaf", fontFamily: "inherit" }
      });
      var hover = vendor.Hover.create({
        lineColor: "#f3f0ff",
        lineWidth: 1,
        labelBackground: "#111827",
        labelColor: "#f7f8fc",
        labelSize: 11,
        formatTimeCallback: formatMediaTime
      });

      waveSurfer = vendor.create({
        container: container,
        media: media,
        url: source,
        height: 76,
        waveColor: "#51617a",
        progressColor: "#9b8cff",
        cursorColor: "#f8f7ff",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        dragToSeek: true,
        interact: true,
        hideScrollbar: true,
        plugins: [timeline, hover]
      });

      if (activeWaveformControllers) activeWaveformControllers.set(media, controller);
      emit({ kind: "loading", message: "Generating waveform…", progress: 0 });
      unsubscribers.push(waveSurfer.on("loading", function (progress) {
        emit({ kind: "loading", message: "Generating waveform…", progress: clampNumber(progress, 0, 100, 0) });
      }));
      unsubscribers.push(waveSurfer.on("ready", function (duration) {
        ready = true;
        onDuration(Number(duration) || media.duration || 0);
        emit({ kind: "ready", message: "" });
      }));
      unsubscribers.push(waveSurfer.on("error", fail));
      addMediaListener("waiting", function () {
        emit({ kind: "buffering", message: "Buffering audio…" });
      });
      addMediaListener("stalled", function () {
        emit({ kind: "buffering", message: "Audio loading has stalled…" });
      });
      addMediaListener("playing", function () {
        if (ready) emit({ kind: "ready", message: "" });
      });
      addMediaListener("canplay", function () {
        if (ready) emit({ kind: "ready", message: "" });
      });
      addMediaListener("error", function () { fail(media.error || new Error("Audio playback failed.")); });
    } catch (error) {
      fail(error);
    }

    return controller;
  }

  function sceneClip(scene) {
    var file = scene && scene.files && scene.files[0] ? scene.files[0] : {};
    var label = scene && scene.title && scene.title.trim() ? scene.title.trim() : (file.basename || "Scene " + scene.id);
    return sanitizeBackgroundClip({
      id: scene.id,
      label: label,
      stream: scene.paths && scene.paths.stream,
      screenshot: scene.paths && scene.paths.screenshot,
      duration: file.duration,
      kind: "scene"
    });
  }

  function audioClip(audio) {
    var file = audio && audio.files && audio.files[0] ? audio.files[0] : {};
    var authors = audio && audio.authors ? audio.authors.map(function (item) { return item.name; }).filter(Boolean) : [];
    var label = audio && audio.title && audio.title.trim() ? audio.title.trim() : (file.basename || "Audio " + audio.id);
    if (authors.length) label += " - " + authors.join(", ");
    return sanitizeBackgroundClip({
      id: audio.id,
      label: label,
      stream: audio.paths && audio.paths.stream,
      screenshot: audio.has_cover && audio.paths ? audio.paths.cover : "",
      duration: file.duration,
      kind: "audio"
    });
  }

  function sortCatalogItems(items, mode) {
    var sortMode = ["name-asc", "name-desc", "count-desc", "count-asc"].indexOf(mode) !== -1 ? mode : "name-asc";
    var output = (items || []).filter(function (item) { return Number(item.count) > 0; }).slice();
    output.sort(function (a, b) {
      var labelResult = a.label.localeCompare(b.label, undefined, { numeric: true });
      if (sortMode === "name-desc") return -labelResult;
      if (sortMode === "count-desc") return (b.count - a.count) || labelResult;
      if (sortMode === "count-asc") return (a.count - b.count) || labelResult;
      return labelResult;
    });
    return output;
  }

  function loadOptions() {
    try {
      return sanitizeOptions(JSON.parse(window.localStorage.getItem(OPTIONS_KEY) || "{}"));
    } catch (_) {
      return sanitizeOptions({});
    }
  }

  function saveOptions(options) {
    try {
      window.localStorage.setItem(OPTIONS_KEY, JSON.stringify(sanitizeOptions(options)));
    } catch (_) {}
  }

  function graphQLURL() {
    var base = document.querySelector("base");
    return new URL("graphql", base && base.href ? base.href : window.location.origin + "/").toString();
  }

  function graphqlRequest(query, variables) {
    return fetch(graphQLURL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ query: query, variables: variables || {} })
    }).then(function (response) {
      if (!response.ok) throw new Error("Stash request failed (" + response.status + ")");
      return response.json();
    }).then(function (payload) {
      if (payload.errors && payload.errors.length) {
        throw new Error(payload.errors.map(function (error) { return error.message; }).join("; "));
      }
      return payload.data;
    });
  }

  function galleryLabel(gallery) {
    if (gallery.title && gallery.title.trim()) return gallery.title.trim();
    if (gallery.folder && gallery.folder.path) {
      return String(gallery.folder.path).split(/[\\/]/).filter(Boolean).pop() || "Gallery " + gallery.id;
    }
    if (gallery.files && gallery.files[0] && gallery.files[0].basename) return gallery.files[0].basename;
    return "Gallery " + gallery.id;
  }

  function sourceForScope(scope, ids, includeDescendants, options) {
    var selected = (ids || []).map(String).filter(Boolean);
    var imageFilter = {};
    if (scope === "gallery") imageFilter.galleries = { value: selected, modifier: "INCLUDES" };
    if (scope === "tag") imageFilter.tags = { value: selected, modifier: "INCLUDES", depth: includeDescendants ? -1 : 0 };
    if (scope === "studio") imageFilter.studios = { value: selected, modifier: "INCLUDES", depth: includeDescendants ? -1 : 0 };
    if (scope === "performer") imageFilter.performers = { value: selected, modifier: "INCLUDES" };
    return {
      kind: "filter",
      imageFilter: imageFilter,
      findFilter: {
        sort: (options || DEFAULT_OPTIONS).sort === "random" ? "path" : (options || DEFAULT_OPTIONS).sort,
        direction: (options || DEFAULT_OPTIONS).direction || "ASC"
      },
      label: scope === "all" ? "All images" : "Selected " + scope + (selected.length === 1 ? "" : "s")
    };
  }

  function shuffledCopy(items, random) {
    var output = items.slice();
    var rand = random || Math.random;
    for (var index = output.length - 1; index > 0; index -= 1) {
      var swap = Math.floor(rand() * (index + 1));
      var value = output[index];
      output[index] = output[swap];
      output[swap] = value;
    }
    return output;
  }

  function normalizeSource(source) {
    var value = source && typeof source === "object" ? source : {};
    var ids = Array.isArray(value.ids) ? value.ids.map(String).filter(Boolean) : [];
    var imageIDs = Array.isArray(value.imageIDs) ? value.imageIDs.map(String).filter(Boolean) : [];
    return {
      kind: ids.length || imageIDs.length ? "ids" : "filter",
      ids: ids.length ? ids : imageIDs,
      imageFilter: value.imageFilter || value.image_filter || {},
      findFilter: value.findFilter || value.filter || {},
      label: value.label || "Image slideshow"
    };
  }

  var IMAGE_QUERY = [
    "query NativeSlideshowImages($imageFilter: ImageFilterType, $ids: [ID!], $filter: FindFilterType) {",
    "  findImages(image_filter: $imageFilter, ids: $ids, filter: $filter) {",
    "    count",
    "    images {",
    "      id title date photographer details",
    "      paths { image thumbnail }",
    "      galleries { id title }",
    "      tags { id name }",
    "      performers { id name }",
    "      studio { id name }",
    "    }",
    "  }",
    "}"
  ].join("\n");

  function fetchImages(source, onProgress) {
    var normalized = normalizeSource(source);
    var pageSize = normalized.ids.length ? -1 : 250;
    var baseFilter = Object.assign({}, normalized.findFilter || {}, {
      page: 1,
      per_page: pageSize
    });
    if (!baseFilter.sort || baseFilter.sort === "random") baseFilter.sort = "path";
    if (!baseFilter.direction) baseFilter.direction = "ASC";

    function fetchPage(page) {
      return graphqlRequest(IMAGE_QUERY, {
        imageFilter: normalized.ids.length ? undefined : normalized.imageFilter,
        ids: normalized.ids.length ? normalized.ids : undefined,
        filter: Object.assign({}, baseFilter, { page: page })
      }).then(function (data) { return data.findImages; });
    }

    return fetchPage(1).then(function (first) {
      var images = first.images || [];
      var total = first.count || images.length;
      if (typeof onProgress === "function") onProgress(images.length, total);
      if (pageSize === -1 || images.length >= total) return images;

      var pages = Math.ceil(total / pageSize);
      var chain = Promise.resolve();
      for (var page = 2; page <= pages; page += 1) {
        (function (requestedPage) {
          chain = chain.then(function () {
            return fetchPage(requestedPage).then(function (result) {
              images = images.concat(result.images || []);
              if (typeof onProgress === "function") onProgress(images.length, total);
            });
          });
        })(page);
      }
      return chain.then(function () { return images; });
    });
  }

  var CATALOG_QUERY = [
    "query NativeSlideshowCatalog {",
    "  findGalleries(filter: { per_page: -1 }) { galleries { id title image_count folder { path } files { basename } } }",
    "  findTags(filter: { per_page: -1 }) { tags { id name image_count child_count } }",
    "  findStudios(filter: { per_page: -1 }) { studios { id name image_count child_studios { id } } }",
    "  findPerformers(filter: { per_page: -1 }) { performers { id name image_count } }",
    "}"
  ].join("\n");

  function loadCatalog() {
    return graphqlRequest(CATALOG_QUERY).then(function (data) {
      var galleries = (data.findGalleries.galleries || []).map(function (item) {
        return { id: String(item.id), label: galleryLabel(item), count: item.image_count || 0, raw: item };
      });
      var tags = (data.findTags.tags || []).map(function (item) {
        return { id: String(item.id), label: item.name, count: item.image_count || 0, childCount: item.child_count || 0, raw: item };
      });
      var studios = (data.findStudios.studios || []).map(function (item) {
        return { id: String(item.id), label: item.name, count: item.image_count || 0, childCount: (item.child_studios || []).length, raw: item };
      });
      var performers = (data.findPerformers.performers || []).map(function (item) {
        return { id: String(item.id), label: item.name, count: item.image_count || 0, raw: item };
      });
      return {
        gallery: sortCatalogItems(galleries, "name-asc"),
        tag: sortCatalogItems(tags, "name-asc"),
        studio: sortCatalogItems(studios, "name-asc"),
        performer: sortCatalogItems(performers, "name-asc")
      };
    });
  }

  var BACKGROUND_CLIP_QUERY = [
    "query NativeSlideshowBackgroundClips($filter: FindFilterType) {",
    "  findScenes(filter: $filter) {",
    "    count",
    "    scenes { id title paths { stream screenshot } files { basename duration } }",
    "  }",
    "}"
  ].join("\n");

  var BACKGROUND_AUDIO_QUERY = [
    "query NativeSlideshowBackgroundAudios($filter: FindFilterType) {",
    "  findAudios(filter: $filter) {",
    "    count",
    "    audios { id title has_cover paths { stream cover } authors { id name } files { basename duration } }",
    "  }",
    "}"
  ].join("\n");

  var audioSchemaPromise;
  function supportsNativeAudio() {
    if (!audioSchemaPromise) {
      audioSchemaPromise = graphqlRequest('query { __type(name: "Audio") { name fields { name } } }').then(function (data) {
        var fields = data.__type && data.__type.fields ? data.__type.fields.map(function (field) { return field.name; }) : [];
        return fields.indexOf("files") !== -1 && fields.indexOf("paths") !== -1;
      }).catch(function () { return false; });
    }
    return audioSchemaPromise;
  }

  function searchBackgroundClips(search) {
    var query = String(search || "").trim();
    var filter = {
      per_page: 24,
      sort: query ? "title" : "created_at",
      direction: query ? "ASC" : "DESC"
    };
    if (query) filter.q = query;
    return Promise.all([
      graphqlRequest(BACKGROUND_CLIP_QUERY, { filter: filter }).then(function (data) {
        return (data.findScenes.scenes || []).map(sceneClip).filter(Boolean);
      }),
      supportsNativeAudio().then(function (supported) {
        if (!supported) return [];
        return graphqlRequest(BACKGROUND_AUDIO_QUERY, { filter: filter }).then(function (data) {
          return (data.findAudios.audios || []).map(audioClip).filter(Boolean);
        });
      })
    ]).then(function (results) {
      return results[1].concat(results[0]);
    });
  }

  function writePending(source) {
    try {
      window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(normalizeSource(source)));
    } catch (_) {}
  }

  function readPending() {
    try {
      var value = window.sessionStorage.getItem(PENDING_KEY);
      if (!value) return null;
      window.sessionStorage.removeItem(PENDING_KEY);
      return normalizeSource(JSON.parse(value));
    } catch (_) {
      return null;
    }
  }

  function navigateWithinStash(path) {
    try {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new PopStateEvent("popstate", { state: window.history.state }));
    } catch (_) {
      window.location.assign(path);
    }
  }

  function launchSource(source) {
    if (window.location.pathname === ROUTE) {
      window.dispatchEvent(new CustomEvent("stash-image-slideshow:launch", { detail: normalizeSource(source) }));
    } else {
      writePending(source);
      navigateWithinStash(ROUTE);
    }
  }

  function sourceFromCurrentList(result, selectedIds) {
    var selected = selectedIds ? Array.from(selectedIds).map(String) : [];
    if (selected.length) return { ids: selected, label: selected.length + (selected.length === 1 ? " selected image" : " selected images") };
    var variables = result && result.variables ? result.variables : {};
    return {
      imageFilter: variables.image_filter || variables.imageFilter || {},
      imageIDs: variables.ids || variables.image_ids || [],
      findFilter: Object.assign({}, variables.filter || {}, { page: 1 }),
      label: document.title ? document.title.replace(/\s*[-|]\s*Stash.*$/i, "") : "Current image set"
    };
  }

  function nextIndex(current, delta, length, loop) {
    if (!length) return 0;
    var next = current + delta;
    if (next < 0) return loop ? length - 1 : 0;
    if (next >= length) return loop ? 0 : length - 1;
    return next;
  }

  function labelledField(label, control, hint) {
    return h("label", { className: "stash-slideshow-field" },
      h("span", { className: "stash-slideshow-field-label" }, label),
      control,
      hint ? h("small", null, hint) : null
    );
  }

  function OptionsPanel(props) {
    var options = props.options;
    function update(key, value) {
      props.onChange(sanitizeOptions(Object.assign({}, options, (function () { var next = {}; next[key] = value; return next; })())));
    }
    function checkbox(key, label, hint) {
      return h("label", { className: "stash-slideshow-check" },
        h("input", { type: "checkbox", checked: !!options[key], onChange: function (event) { update(key, event.target.checked); } }),
        h("span", null, label, hint ? h("small", null, hint) : null)
      );
    }
    return h("div", { className: "stash-slideshow-options" },
      labelledField("Image duration",
        h("div", { className: "stash-slideshow-range" },
          h("input", { type: "range", min: "1", max: "60", step: "0.5", value: options.displaySeconds, onChange: function (event) { update("displaySeconds", event.target.value); } }),
          h("output", null, options.displaySeconds + "s")
        ), "How long each image remains visible."),
      labelledField("Transition",
        h("select", { value: options.transition, onChange: function (event) { update("transition", event.target.value); } },
          h("option", { value: "fade" }, "Fade"),
          h("option", { value: "slide" }, "Slide"),
          h("option", { value: "zoom" }, "Gentle zoom"),
          h("option", { value: "none" }, "None")
        )),
      labelledField("Transition speed",
        h("div", { className: "stash-slideshow-range" },
          h("input", { type: "range", min: "0", max: "3", step: "0.05", value: options.transitionSeconds, onChange: function (event) { update("transitionSeconds", event.target.value); } }),
          h("output", null, options.transitionSeconds + "s")
        )),
      labelledField("Image fit",
        h("select", { value: options.fit, onChange: function (event) { update("fit", event.target.value); } },
          h("option", { value: "contain" }, "Fit whole image"),
          h("option", { value: "cover" }, "Fill screen (crop edges)"),
          h("option", { value: "native" }, "Original size")
        )),
      labelledField("Background",
        h("div", { className: "stash-slideshow-color" },
          h("input", { type: "color", value: options.background, onChange: function (event) { update("background", event.target.value); } }),
          h("code", null, options.background)
        )),
      props.showOrdering ? labelledField("Order",
        h("div", { className: "stash-slideshow-order" },
          h("select", { value: options.sort, onChange: function (event) { update("sort", event.target.value); } },
            h("option", { value: "path" }, "File path"),
            h("option", { value: "title" }, "Title"),
            h("option", { value: "date" }, "Date"),
            h("option", { value: "created_at" }, "Added to Stash"),
            h("option", { value: "random" }, "Random")
          ),
          h("select", { value: options.direction, disabled: options.sort === "random", onChange: function (event) { update("direction", event.target.value); } },
            h("option", { value: "ASC" }, "Ascending"),
            h("option", { value: "DESC" }, "Descending")
          )
        )) : null,
      h("div", { className: "stash-slideshow-checks" },
        checkbox("loop", "Loop continuously"),
        checkbox("shuffle", "Shuffle when starting", "The source order remains unchanged."),
        checkbox("showCaptions", "Show image details"),
        checkbox("preload", "Preload the next image")
      )
    );
  }

  function BackgroundClipSetup(props) {
    var options = props.options;
    var clip = options.backgroundClip;
    var queryState = React.useState("");
    var query = queryState[0];
    var setQuery = queryState[1];
    var expandedState = React.useState(!clip);
    var expanded = expandedState[0];
    var setExpanded = expandedState[1];
    var resultsState = React.useState([]);
    var results = resultsState[0];
    var setResults = resultsState[1];
    var searchingState = React.useState(false);
    var searching = searchingState[0];
    var setSearching = searchingState[1];
    var errorState = React.useState("");
    var error = errorState[0];
    var setError = errorState[1];

    function update(patch) {
      props.onChange(sanitizeOptions(Object.assign({}, options, patch)));
    }

    React.useEffect(function () {
      if (!expanded) return undefined;
      var active = true;
      var timer = window.setTimeout(function () {
        setSearching(true);
        setError("");
        searchBackgroundClips(query).then(function (items) {
          if (active) setResults(items);
        }).catch(function (reason) {
          if (active) setError(reason.message || String(reason));
        }).finally(function () {
          if (active) setSearching(false);
        });
      }, query.trim() ? 250 : 0);
      return function () {
        active = false;
        window.clearTimeout(timer);
      };
    }, [query, expanded]);

    function choose(selected) {
      update({ backgroundClip: selected });
      setExpanded(false);
      setQuery("");
    }

    return h("section", { className: "stash-slideshow-audio-setup" },
      h("div", { className: "stash-slideshow-audio-heading" },
        h("div", null,
          h("span", { className: "stash-slideshow-audio-title" }, icon("music"), "Background clip"),
          h("small", null, "Optional · plays the clip's audio while images advance")
        ),
        clip ? h("button", { type: "button", className: "minimal", onClick: function () { update({ backgroundClip: null }); setExpanded(true); } }, "Remove") : null
      ),
      clip ? h("div", { className: "stash-slideshow-selected-clip" },
        clip.screenshot ? h("img", { src: clip.screenshot, alt: "", loading: "lazy" }) : icon("music"),
        h("div", { className: "stash-slideshow-selected-clip-copy" },
          h("strong", { title: clip.label }, clip.label),
          h("small", null, formatMediaTime(clip.duration), " - Stash ", clip.kind === "audio" ? "audio" : "scene", " #", clip.id)
        ),
        h("button", { type: "button", onClick: function () { setExpanded(!expanded); } }, expanded ? "Done" : "Change")
      ) : null,
      expanded ? h("div", { className: "stash-slideshow-clip-browser" },
        h("input", {
          type: "search",
          className: "stash-slideshow-clip-search",
          placeholder: "Search native audio, scenes, or filenames...",
          value: query,
          onChange: function (event) { setQuery(event.target.value); }
        }),
        h("div", { className: "stash-slideshow-clip-results-head" },
          h("span", null, query.trim() ? "Search results" : "Recently added audio and scenes"),
          searching ? h("small", null, "Searching…") : null
        ),
        error ? h("div", { className: "stash-slideshow-clip-error" }, error) : null,
        h("div", { className: "stash-slideshow-clip-results", "aria-busy": searching },
          results.length ? results.map(function (item) {
            return h("button", { key: item.id, type: "button", onClick: function () { choose(item); } },
              item.screenshot ? h("img", { src: item.screenshot, alt: "", loading: "lazy" }) : h("span", { className: "stash-slideshow-clip-placeholder" }, icon("music")),
              h("span", { className: "stash-slideshow-clip-result-copy" },
                h("strong", { title: item.label }, item.label),
                h("small", null, formatMediaTime(item.duration), " - ", item.kind === "audio" ? "Audio" : "Scene", " #", item.id)
              )
            );
          }) : !searching ? h("div", { className: "stash-slideshow-clip-empty" }, "No playable native audio or Stash scenes found.") : null
        )
      ) : null,
      clip ? h("div", { className: "stash-slideshow-audio-options" },
        labelledField("Clip volume",
          h("div", { className: "stash-slideshow-range" },
            h("input", { type: "range", min: "0", max: "1", step: "0.05", value: options.backgroundVolume, onChange: function (event) { update({ backgroundVolume: event.target.value }); }, "aria-label": "Clip volume" }),
            h("output", null, Math.round(options.backgroundVolume * 100) + "%")
          )),
        h("label", { className: "stash-slideshow-check" },
          h("input", { type: "checkbox", checked: options.backgroundLoop, onChange: function (event) { update({ backgroundLoop: event.target.checked }); } }),
          h("span", null, "Loop the background clip")
        )
      ) : null
    );
  }

  function BackgroundClipLiveOptions(props) {
    var options = props.options;
    if (!options.backgroundClip) return null;
    function update(patch) {
      props.onChange(sanitizeOptions(Object.assign({}, options, patch)));
    }
    return h("section", { className: "stash-slideshow-live-audio-options" },
      h("h3", null, icon("music"), "Background clip"),
      h("strong", { title: options.backgroundClip.label }, options.backgroundClip.label),
      labelledField("Volume",
        h("div", { className: "stash-slideshow-range" },
          h("input", { type: "range", min: "0", max: "1", step: "0.05", value: options.backgroundVolume, onChange: function (event) { update({ backgroundVolume: event.target.value }); }, "aria-label": "Clip volume" }),
          h("output", null, Math.round(options.backgroundVolume * 100) + "%")
        )),
      h("label", { className: "stash-slideshow-check" },
        h("input", { type: "checkbox", checked: options.backgroundLoop, onChange: function (event) { update({ backgroundLoop: event.target.checked }); } }),
        h("span", null, "Loop clip")
      )
    );
  }

  function Player(props) {
    var images = props.images;
    var optionsState = React.useState(props.options);
    var options = optionsState[0];
    var setOptions = optionsState[1];
    var indexState = React.useState(0);
    var index = indexState[0];
    var setIndex = indexState[1];
    var transitionState = React.useState(null);
    var transition = transitionState[0];
    var setTransition = transitionState[1];
    var transitionToken = React.useRef(0);
    var playingState = React.useState(true);
    var playing = playingState[0];
    var setPlaying = playingState[1];
    var settingsState = React.useState(false);
    var settingsOpen = settingsState[0];
    var setSettingsOpen = settingsState[1];
    var rootRef = React.useRef(null);
    var mediaRef = React.useRef(null);
    var waveformContainerRef = React.useRef(null);
    var timelineContainerRef = React.useRef(null);
    var waveformControllerRef = React.useRef(null);
    var mediaPlayingState = React.useState(false);
    var mediaPlaying = mediaPlayingState[0];
    var setMediaPlaying = mediaPlayingState[1];
    var mediaBlockedState = React.useState(false);
    var mediaBlocked = mediaBlockedState[0];
    var setMediaBlocked = mediaBlockedState[1];
    var mediaTimeState = React.useState(0);
    var mediaTime = mediaTimeState[0];
    var setMediaTime = mediaTimeState[1];
    var mediaDurationState = React.useState(options.backgroundClip ? options.backgroundClip.duration : 0);
    var mediaDuration = mediaDurationState[0];
    var setMediaDuration = mediaDurationState[1];
    var mediaMutedState = React.useState(false);
    var mediaMuted = mediaMutedState[0];
    var setMediaMuted = mediaMutedState[1];
    var mediaRateState = React.useState(1);
    var mediaRate = mediaRateState[0];
    var setMediaRate = mediaRateState[1];
    var waveformState = React.useState({ kind: "idle", message: "", progress: 0 });
    var waveformStatus = waveformState[0];
    var setWaveformStatus = waveformState[1];
    var playbackErrorState = React.useState("");
    var playbackError = playbackErrorState[0];
    var setPlaybackError = playbackErrorState[1];
    var current = images[index];

    function commitOptions(next) {
      setOptions(next);
      if (typeof props.onOptionsChange === "function") props.onOptionsChange(next);
      else saveOptions(next);
    }

    function move(delta) {
      if (transition) return;
      var next = nextIndex(index, delta, images.length, options.loop);
      if (next === index) {
        if (!options.loop && delta > 0 && index === images.length - 1) setPlaying(false);
        return;
      }
      if (options.transition === "none" || options.transitionSeconds <= 0) {
        setIndex(next);
        return;
      }
      transitionToken.current += 1;
      setTransition({
        from: index,
        to: next,
        direction: delta < 0 ? "backward" : "forward",
        phase: "loading",
        token: transitionToken.current
      });
    }

    function beginTransition(token) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          setTransition(function (currentTransition) {
            if (!currentTransition || currentTransition.token !== token || currentTransition.phase !== "loading") return currentTransition;
            return Object.assign({}, currentTransition, { phase: "active" });
          });
        });
      });
    }

    React.useEffect(function () {
      if (!playing || !images.length || transition) return undefined;
      var timer = window.setTimeout(function () { move(1); }, options.displaySeconds * 1000);
      return function () { window.clearTimeout(timer); };
    }, [playing, index, options.displaySeconds, options.loop, images.length, transition]);

    React.useEffect(function () {
      if (!transition) return undefined;
      if (transition.phase === "loading") {
        var fallbackTimer = window.setTimeout(function () { beginTransition(transition.token); }, 1200);
        return function () { window.clearTimeout(fallbackTimer); };
      }
      if (transition.phase === "active") {
        var finishTimer = window.setTimeout(function () {
          setIndex(transition.to);
          setTransition(null);
        }, Math.max(20, options.transitionSeconds * 1000));
        return function () { window.clearTimeout(finishTimer); };
      }
      return undefined;
    }, [transition, options.transitionSeconds]);

    React.useEffect(function () {
      if (!options.preload || images.length < 2) return;
      var nextImage = images[(index + 1) % images.length];
      if (nextImage && nextImage.paths && nextImage.paths.image) {
        var preload = new Image();
        preload.src = nextImage.paths.image;
      }
    }, [index, images, options.preload]);

    React.useEffect(function () {
      var clip = options.backgroundClip;
      if (!clip || clip.kind !== "audio") {
        setWaveformStatus({ kind: "idle", message: "", progress: 0 });
        return undefined;
      }
      var media = mediaRef.current;
      var container = waveformContainerRef.current;
      var timelineContainer = timelineContainerRef.current;
      setWaveformStatus({ kind: "loading", message: "Generating waveform…", progress: 0 });
      var controller = createWaveformController({
        media: media,
        container: container,
        timelineContainer: timelineContainer,
        source: clip.stream,
        vendor: window.WaveSurfer,
        onState: setWaveformStatus,
        onDuration: function (duration) { setMediaDuration(duration || clip.duration || 0); }
      });
      waveformControllerRef.current = controller;
      return function () {
        if (waveformControllerRef.current === controller) waveformControllerRef.current = null;
        controller.destroy();
      };
    }, [options.backgroundClip && options.backgroundClip.kind, options.backgroundClip && options.backgroundClip.id, options.backgroundClip && options.backgroundClip.stream]);

    React.useEffect(function () {
      var media = mediaRef.current;
      if (!media || !options.backgroundClip) return undefined;
      setMediaTime(0);
      setMediaDuration(options.backgroundClip.duration || 0);
      setMediaBlocked(false);
      setPlaybackError("");
      media.volume = options.backgroundVolume;
      media.muted = mediaMuted || options.backgroundVolume <= 0;
      media.loop = options.backgroundLoop;
      media.playbackRate = mediaRate;
      var playResult = media.play();
      if (playResult && typeof playResult.catch === "function") playResult.catch(recordPlaybackFailure);
      return function () { media.pause(); };
    }, [options.backgroundClip && options.backgroundClip.kind, options.backgroundClip && options.backgroundClip.id, options.backgroundClip && options.backgroundClip.stream]);

    React.useEffect(function () {
      var media = mediaRef.current;
      if (!media) return;
      media.volume = options.backgroundVolume;
      media.muted = mediaMuted || options.backgroundVolume <= 0;
      media.loop = options.backgroundLoop;
      media.playbackRate = mediaRate;
    }, [options.backgroundVolume, options.backgroundLoop, mediaMuted, mediaRate]);

    React.useEffect(function () {
      function keydown(event) {
        if (event.target && /input|select|textarea/i.test(event.target.tagName)) return;
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
        if (event.key === " " || event.key === "k") { event.preventDefault(); setPlaying(function (value) { return !value; }); }
        if (event.key.toLowerCase() === "m" && options.backgroundClip) { event.preventDefault(); toggleBackgroundMedia(); }
        if (event.key.toLowerCase() === "f") { event.preventDefault(); toggleFullscreen(); }
        if (event.key === "Escape" && !document.fullscreenElement) props.onClose();
      }
      window.addEventListener("keydown", keydown);
      return function () { window.removeEventListener("keydown", keydown); };
    });

    function toggleFullscreen() {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(function () {});
      } else if (rootRef.current && rootRef.current.requestFullscreen) {
        rootRef.current.requestFullscreen().catch(function () {});
      }
    }

    function toggleBackgroundMedia() {
      var media = mediaRef.current;
      if (!media) return;
      if (media.paused) {
        var playResult = media.play();
        if (playResult && typeof playResult.catch === "function") playResult.catch(recordPlaybackFailure);
      } else {
        media.pause();
      }
    }

    function recordPlaybackFailure(error) {
      var failure = classifyMediaError(mediaRef.current, error);
      setMediaPlaying(false);
      if (failure.kind === "blocked") {
        setMediaBlocked(true);
        return;
      }
      setPlaybackError(failure.message);
      if (options.backgroundClip && options.backgroundClip.kind === "audio") {
        setWaveformStatus({ kind: failure.kind, message: failure.message, progress: 0 });
      }
    }

    function handleMediaError(event) {
      var failure = classifyMediaError(event.currentTarget, event.currentTarget.error);
      setMediaPlaying(false);
      setPlaybackError(failure.message);
      if (options.backgroundClip && options.backgroundClip.kind === "audio") {
        setWaveformStatus({ kind: failure.kind, message: failure.message, progress: 0 });
      }
    }

    function seekBackgroundMedia(event) {
      var media = mediaRef.current;
      if (!media) return;
      media.currentTime = clampNumber(event.target.value, 0, mediaDuration || 0, 0);
      setMediaTime(media.currentTime);
    }

    function skipBackgroundMedia(seconds) {
      var media = mediaRef.current;
      if (!media) return;
      setMediaTime(seekMediaBy(media, seconds, mediaDuration));
    }

    function changeBackgroundVolume(event) {
      var nextVolume = clampNumber(event.target.value, 0, 1, options.backgroundVolume);
      var media = mediaRef.current;
      if (media) {
        media.volume = nextVolume;
        if (nextVolume > 0) media.muted = false;
      }
      if (nextVolume > 0) setMediaMuted(false);
      commitOptions(sanitizeOptions(Object.assign({}, options, { backgroundVolume: nextVolume })));
    }

    function toggleBackgroundMute() {
      var media = mediaRef.current;
      if (!media) return;
      var shouldMute = !(media.muted || media.volume <= 0);
      if (!shouldMute && options.backgroundVolume <= 0) {
        commitOptions(sanitizeOptions(Object.assign({}, options, { backgroundVolume: DEFAULT_OPTIONS.backgroundVolume })));
        media.volume = DEFAULT_OPTIONS.backgroundVolume;
      }
      media.muted = shouldMute;
      setMediaMuted(shouldMute);
    }

    function changePlaybackRate(event) {
      var nextRate = setMediaPlaybackRate(mediaRef.current, event.target.value);
      setMediaRate(nextRate);
    }

    function toggleBackgroundRepeat() {
      commitOptions(sanitizeOptions(Object.assign({}, options, { backgroundLoop: !options.backgroundLoop })));
    }

    var displayIndex = transition ? transition.to : index;
    current = images[displayIndex];
    var fitClass = options.fit === "native" ? "fit-native" : "fit-" + options.fit;
    var title = current.title || (current.galleries && current.galleries[0] && current.galleries[0].title) || "Image " + current.id;
    var details = [];
    if (current.studio) details.push(current.studio.name);
    if (current.performers && current.performers.length) details.push(current.performers.map(function (item) { return item.name; }).join(", "));
    if (current.tags && current.tags.length) details.push(current.tags.slice(0, 6).map(function (item) { return item.name; }).join(" · "));

    var backgroundClip = options.backgroundClip;
    var isAudioBackground = !!(backgroundClip && backgroundClip.kind === "audio");
    var waveformFallback = isAudioBackground && ["fallback", "unsupported", "error"].indexOf(waveformStatus.kind) !== -1;
    var waveformMessage = playbackError || (mediaBlocked ? "Press play once to allow background audio." : waveformStatus.message);
    var mediaElement = backgroundClip ? h(isAudioBackground ? "audio" : "video", {
      ref: mediaRef,
      className: "stash-slideshow-background-media" + (isAudioBackground && waveformFallback ? " is-native-fallback" : ""),
      src: backgroundClip.stream,
      preload: "auto",
      playsInline: true,
      controls: isAudioBackground && waveformFallback,
      loop: options.backgroundLoop,
      muted: mediaMuted || options.backgroundVolume <= 0,
      onPlay: function () { setMediaPlaying(true); setMediaBlocked(false); setPlaybackError(""); },
      onPause: function () { setMediaPlaying(false); },
      onTimeUpdate: function (event) { setMediaTime(event.currentTarget.currentTime || 0); },
      onLoadedMetadata: function (event) { setMediaDuration(event.currentTarget.duration || backgroundClip.duration || 0); },
      onDurationChange: function (event) { setMediaDuration(event.currentTarget.duration || backgroundClip.duration || 0); },
      onVolumeChange: function (event) { setMediaMuted(event.currentTarget.muted); },
      onRateChange: function (event) { setMediaRate(event.currentTarget.playbackRate || 1); },
      onError: handleMediaError,
      onEnded: function () { setMediaPlaying(false); }
    }) : null;

    return h("div", {
      className: "stash-slideshow-player " + fitClass + (isAudioBackground ? " has-wave-audio" : ""),
      ref: rootRef,
      style: {
        backgroundColor: options.background,
        "--stash-slideshow-transition": options.transitionSeconds + "s",
        "--stash-slideshow-duration": options.displaySeconds + "s"
      }
    },
      backgroundClip && !isAudioBackground ? mediaElement : null,
      h("div", { className: "stash-slideshow-stage" },
        transition ? h(React.Fragment, null,
          h("img", {
            key: "outgoing:" + transition.token,
            className: "stash-slideshow-image stash-slideshow-layer outgoing transition-" + options.transition + " direction-" + transition.direction + (transition.phase === "active" ? " is-active" : ""),
            src: images[transition.from].paths.image || images[transition.from].paths.thumbnail,
            alt: "",
            draggable: false
          }),
          h("img", {
            key: "incoming:" + transition.token,
            className: "stash-slideshow-image stash-slideshow-layer incoming transition-" + options.transition + " direction-" + transition.direction + (transition.phase === "active" ? " is-active" : ""),
            src: images[transition.to].paths.image || images[transition.to].paths.thumbnail,
            alt: title,
            draggable: false,
            onLoad: function () { beginTransition(transition.token); },
            onError: function () { beginTransition(transition.token); }
          })
        ) : h("img", {
          key: "current:" + current.id,
          className: "stash-slideshow-image stash-slideshow-current",
          src: current.paths.image || current.paths.thumbnail,
          alt: title,
          draggable: false
        }),
        h("button", { className: "stash-slideshow-hit previous", type: "button", onClick: function () { move(-1); }, "aria-label": "Previous image" }, icon("previous")),
        h("button", { className: "stash-slideshow-hit next", type: "button", onClick: function () { move(1); }, "aria-label": "Next image" }, icon("next"))
      ),
      h("div", { className: "stash-slideshow-topbar" },
        h("div", { className: "stash-slideshow-brand" }, icon("slideshow"), h("span", null, props.label || "Image Slideshow")),
        h("div", { className: "stash-slideshow-top-actions" },
          h("a", { href: "/images/" + current.id, target: "_blank", rel: "noreferrer", title: "Open image details" }, icon("external")),
          h("button", { type: "button", onClick: toggleFullscreen, title: "Fullscreen (F)" }, icon("fullscreen")),
          h("button", { type: "button", className: settingsOpen ? "active" : "", onClick: function () { setSettingsOpen(!settingsOpen); }, title: "Slideshow settings" }, icon("settings")),
          h("button", { type: "button", onClick: props.onClose, title: "Close slideshow" }, icon("close"))
        )
      ),
      options.showCaptions ? h("div", { className: "stash-slideshow-caption" },
        h("strong", null, title),
        details.length ? h("small", null, details.join(" — ")) : null
      ) : null,
      h("div", { className: "stash-slideshow-controls" },
        h("button", { type: "button", onClick: function () { move(-1); }, title: "Previous (Left arrow)" }, icon("previous")),
        h("button", { type: "button", className: "primary", onClick: function () { setPlaying(!playing); }, title: playing ? "Pause (Space)" : "Play (Space)" }, icon(playing ? "pause" : "play")),
        h("button", { type: "button", onClick: function () { move(1); }, title: "Next (Right arrow)" }, icon("next")),
        h("span", { className: "stash-slideshow-counter" }, (displayIndex + 1) + " / " + images.length)
      ),
      isAudioBackground ? h("section", { className: "stash-slideshow-wave-player is-" + waveformStatus.kind + (waveformFallback && waveformStatus.kind !== "fallback" ? " is-fallback" : ""), "aria-label": "Background audio player" },
        h("div", { className: "stash-slideshow-wave-head" },
          h("span", { className: "stash-slideshow-wave-title", title: backgroundClip.label }, icon("music"), h("strong", null, backgroundClip.label)),
          waveformMessage ? h("span", { className: "stash-slideshow-wave-status", role: waveformStatus.kind === "error" || waveformStatus.kind === "unsupported" ? "alert" : "status" },
            waveformStatus.kind === "loading" && waveformStatus.progress ? waveformMessage + " " + Math.round(waveformStatus.progress) + "%" : waveformMessage
          ) : null
        ),
        mediaElement,
        h("div", { className: "stash-slideshow-wave-visual" + (waveformFallback ? " is-hidden" : ""), "aria-label": "Interactive audio waveform. Click or drag to seek." },
          h("div", { className: "stash-slideshow-waveform", ref: waveformContainerRef }),
          h("div", { className: "stash-slideshow-wave-timeline", ref: timelineContainerRef }),
          !waveformFallback && waveformStatus.kind === "loading" ? h("div", { className: "stash-slideshow-wave-loading", style: { "--stash-wave-progress": (waveformStatus.progress || 0) + "%" } }, h("span", null, "Loading waveform")) : null
        ),
        !waveformFallback ? h("div", { className: "stash-slideshow-wave-controls" },
          h("div", { className: "stash-slideshow-wave-transport" },
            h("button", { type: "button", onClick: function () { move(-1); }, title: "Previous slideshow item", "aria-label": "Previous slideshow item" }, icon("previous")),
            h("button", { type: "button", onClick: function () { skipBackgroundMedia(-10); }, title: "Rewind 10 seconds", "aria-label": "Rewind 10 seconds" }, icon("rewind")),
            h("button", { type: "button", className: "primary", onClick: toggleBackgroundMedia, title: mediaPlaying ? "Pause background audio (M)" : "Play background audio (M)", "aria-label": mediaPlaying ? "Pause background audio" : "Play background audio" }, icon(mediaPlaying ? "pause" : "play")),
            h("button", { type: "button", onClick: function () { skipBackgroundMedia(10); }, title: "Forward 10 seconds", "aria-label": "Forward 10 seconds" }, icon("forward")),
            h("button", { type: "button", onClick: function () { move(1); }, title: "Next slideshow item", "aria-label": "Next slideshow item" }, icon("next"))
          ),
          h("span", { className: "stash-slideshow-wave-time" }, formatMediaTime(mediaTime), " / ", formatMediaTime(mediaDuration || backgroundClip.duration)),
          h("div", { className: "stash-slideshow-wave-volume" },
            h("button", { type: "button", onClick: toggleBackgroundMute, title: mediaMuted || options.backgroundVolume <= 0 ? "Unmute" : "Mute", "aria-label": mediaMuted || options.backgroundVolume <= 0 ? "Unmute background audio" : "Mute background audio" }, icon(mediaMuted || options.backgroundVolume <= 0 ? "muted" : "volume")),
            h("input", { type: "range", min: "0", max: "1", step: "0.01", value: options.backgroundVolume, onChange: changeBackgroundVolume, "aria-label": "Background audio volume" })
          ),
          h("label", { className: "stash-slideshow-wave-speed" },
            h("span", null, "Speed"),
            h("select", { value: String(mediaRate), onChange: changePlaybackRate, "aria-label": "Background audio playback speed" },
              [0.5, 0.75, 1, 1.25, 1.5, 2].map(function (rate) { return h("option", { key: rate, value: String(rate) }, rate + "×"); })
            )
          ),
          h("button", { type: "button", className: "stash-slideshow-wave-repeat" + (options.backgroundLoop ? " active" : ""), onClick: toggleBackgroundRepeat, title: options.backgroundLoop ? "Disable repeat current track" : "Repeat current track", "aria-label": "Repeat current track", "aria-pressed": options.backgroundLoop }, icon("repeat"))
        ) : h("div", { className: "stash-slideshow-native-fallback-note" }, "The same audio element is still active through the browser controls above.")
      ) : backgroundClip ? h("div", { className: "stash-slideshow-audio-control" + (mediaBlocked ? " is-blocked" : "") },
        h("button", { type: "button", onClick: toggleBackgroundMedia, title: mediaPlaying ? "Pause background clip (M)" : "Play background clip (M)", "aria-label": mediaPlaying ? "Pause background clip" : "Play background clip" }, icon(mediaPlaying ? "pause" : "play")),
        h("div", { className: "stash-slideshow-audio-control-copy" },
          h("span", { title: backgroundClip.label }, icon("music"), h("strong", null, backgroundClip.label)),
          mediaBlocked ? h("small", null, "Press play to allow background audio") : h("input", {
            type: "range",
            min: "0",
            max: String(mediaDuration || backgroundClip.duration || 0),
            step: "0.1",
            value: Math.min(mediaTime, mediaDuration || backgroundClip.duration || 0),
            onChange: seekBackgroundMedia,
            "aria-label": "Background clip position"
          })
        ),
        h("span", { className: "stash-slideshow-audio-time" }, formatMediaTime(mediaTime), " / ", formatMediaTime(mediaDuration || backgroundClip.duration))
      ) : null,
      playing ? h("div", { key: index + ":" + options.displaySeconds, className: "stash-slideshow-progress", style: { animationDuration: options.displaySeconds + "s" } }) : null,
      settingsOpen ? h("aside", { className: "stash-slideshow-live-settings" },
        h("div", { className: "stash-slideshow-live-settings-head" }, h("h2", null, "Playback"), h("button", { type: "button", onClick: function () { setSettingsOpen(false); } }, icon("close"))),
        h(OptionsPanel, { options: options, onChange: commitOptions, showOrdering: false }),
        h(BackgroundClipLiveOptions, { options: options, onChange: commitOptions }),
        h("div", { className: "stash-slideshow-shortcuts" },
          h("strong", null, "Keyboard"),
          h("span", null, "← / → Previous or next"),
          h("span", null, "Space Play or pause"),
          options.backgroundClip ? h("span", null, "M Background clip play or pause") : null,
          h("span", null, "F Fullscreen"),
          h("span", null, "Esc Close")
        )
      ) : null
    );
  }

  function SlideshowPage() {
    var optionsState = React.useState(loadOptions());
    var options = optionsState[0];
    var setOptions = optionsState[1];
    var scopeState = React.useState("gallery");
    var scope = scopeState[0];
    var setScope = scopeState[1];
    var selectedState = React.useState({ gallery: [], tag: [], studio: [], performer: [] });
    var selected = selectedState[0];
    var setSelected = selectedState[1];
    var descendantsState = React.useState(true);
    var includeDescendants = descendantsState[0];
    var setIncludeDescendants = descendantsState[1];
    var searchState = React.useState("");
    var search = searchState[0];
    var setSearch = searchState[1];
    var sourceSortState = React.useState("name-asc");
    var sourceSort = sourceSortState[0];
    var setSourceSort = sourceSortState[1];
    var catalogState = React.useState(null);
    var catalog = catalogState[0];
    var setCatalog = catalogState[1];
    var loadingCatalogState = React.useState(true);
    var loadingCatalog = loadingCatalogState[0];
    var setLoadingCatalog = loadingCatalogState[1];
    var imagesState = React.useState(null);
    var images = imagesState[0];
    var setImages = imagesState[1];
    var sourceState = React.useState(null);
    var activeSource = sourceState[0];
    var setActiveSource = sourceState[1];
    var statusState = React.useState("");
    var status = statusState[0];
    var setStatus = statusState[1];
    var errorState = React.useState("");
    var error = errorState[0];
    var setError = errorState[1];
    var busyState = React.useState(false);
    var busy = busyState[0];
    var setBusy = busyState[1];

    function commitOptions(next) {
      setOptions(next);
      saveOptions(next);
    }

    function start(source) {
      var normalized = normalizeSource(source);
      setBusy(true);
      setError("");
      setStatus("Loading images…");
      setActiveSource(normalized);
      fetchImages(normalized, function (loaded, total) {
        setStatus("Loaded " + loaded.toLocaleString() + " of " + total.toLocaleString() + " images…");
      }).then(function (loadedImages) {
        if (!loadedImages.length) throw new Error("No images match this slideshow source.");
        var shouldShuffle = options.shuffle || options.sort === "random";
        setImages(shouldShuffle ? shuffledCopy(loadedImages) : loadedImages);
        setStatus("");
      }).catch(function (reason) {
        setError(reason.message || String(reason));
        setStatus("");
      }).finally(function () { setBusy(false); });
    }

    React.useEffect(function () {
      loadCatalog().then(setCatalog).catch(function (reason) {
        setError("Could not load slideshow groups: " + (reason.message || String(reason)));
      }).finally(function () { setLoadingCatalog(false); });
      var pending = readPending();
      if (pending) start(pending);
      function launch(event) { start(event.detail || readPending()); }
      window.addEventListener("stash-image-slideshow:launch", launch);
      return function () { window.removeEventListener("stash-image-slideshow:launch", launch); };
    }, []);

    if (images && images.length) {
      return h(Player, {
        images: images,
        options: options,
        label: activeSource && activeSource.label,
        onOptionsChange: commitOptions,
        onClose: function () { setImages(null); setStatus(""); }
      });
    }

    var scopeItems = catalog && catalog[scope] ? catalog[scope] : [];
    var query = search.trim().toLowerCase();
    var matchingItems = scopeItems.filter(function (item) {
      return !query || item.label.toLowerCase().indexOf(query) !== -1;
    });
    var visibleItems = sortCatalogItems(matchingItems, sourceSort).slice(0, 400);
    var selectedIDs = selected[scope] || [];

    function toggle(id) {
      setSelected(function (current) {
        var list = current[scope] || [];
        var next = list.indexOf(id) === -1 ? list.concat([id]) : list.filter(function (value) { return value !== id; });
        var output = Object.assign({}, current);
        output[scope] = next;
        return output;
      });
    }

    function selectedLabel() {
      if (scope === "all") return "All images";
      var names = scopeItems.filter(function (item) { return selectedIDs.indexOf(item.id) !== -1; }).map(function (item) { return item.label; });
      if (!names.length) return "Selected " + scope;
      if (names.length <= 2) return names.join(" + ");
      return names[0] + " + " + (names.length - 1) + " more";
    }

    function startBuilderSource() {
      var source = sourceForScope(scope, selectedIDs, includeDescendants, options);
      source.label = selectedLabel();
      start(source);
    }

    var scopes = [
      { key: "gallery", label: "Galleries" },
      { key: "tag", label: "Tag families" },
      { key: "studio", label: "Studios" },
      { key: "performer", label: "Performers" },
      { key: "all", label: "All images" }
    ];

    return h("main", { className: "stash-slideshow-page" },
      h("header", { className: "stash-slideshow-page-head" },
        h("div", { className: "stash-slideshow-page-title" }, icon("slideshow"), h("div", null, h("h1", null, "Image Slideshow"), h("p", null, "Play any Stash image group or filtered image set without leaving the UI."))),
        h("span", { className: "stash-slideshow-version" }, "v" + VERSION)
      ),
      error ? h("div", { className: "stash-slideshow-alert" }, error) : null,
      h("div", { className: "stash-slideshow-builder" },
        h("section", { className: "stash-slideshow-card stash-slideshow-source" },
          h("div", { className: "stash-slideshow-section-head" }, h("div", null, h("span", { className: "eyebrow" }, "1 · Choose images"), h("h2", null, "Slideshow source")), selectedIDs.length ? h("button", { type: "button", className: "minimal", onClick: function () { setSelected(function (current) { var output = Object.assign({}, current); output[scope] = []; return output; }); } }, "Clear") : null),
          h("div", { className: "stash-slideshow-tabs", role: "tablist" }, scopes.map(function (item) {
            return h("button", { key: item.key, type: "button", role: "tab", "aria-selected": scope === item.key, className: scope === item.key ? "active" : "", onClick: function () { setScope(item.key); setSearch(""); } }, item.label);
          })),
          scope === "all" ? h("div", { className: "stash-slideshow-all-source" }, icon("slideshow"), h("h3", null, "Your complete image library"), h("p", null, "Stash will load all matching image records in batches before playback begins.")) : h(React.Fragment, null,
            (scope === "tag" || scope === "studio") ? h("label", { className: "stash-slideshow-descendants" }, h("input", { type: "checkbox", checked: includeDescendants, onChange: function (event) { setIncludeDescendants(event.target.checked); } }), h("span", null, scope === "tag" ? "Include images from child tags" : "Include child studios")) : null,
            h("div", { className: "stash-slideshow-source-tools" },
              h("input", { className: "stash-slideshow-search", type: "search", placeholder: "Search " + scopes.find(function (item) { return item.key === scope; }).label.toLowerCase(), value: search, onChange: function (event) { setSearch(event.target.value); } }),
              h("select", { className: "stash-slideshow-source-sort", value: sourceSort, onChange: function (event) { setSourceSort(event.target.value); }, "aria-label": "Sort slideshow sources" },
                h("option", { value: "name-asc" }, "Name: A to Z"),
                h("option", { value: "name-desc" }, "Name: Z to A"),
                h("option", { value: "count-desc" }, "Most images"),
                h("option", { value: "count-asc" }, "Fewest images")
              )
            ),
            !loadingCatalog ? h("div", { className: "stash-slideshow-source-summary" }, matchingItems.length.toLocaleString(), query ? " matching sources with images" : " sources with images") : null,
            h("div", { className: "stash-slideshow-picker", "aria-busy": loadingCatalog },
              loadingCatalog ? h("div", { className: "stash-slideshow-empty" }, "Loading groups…") : visibleItems.length ? visibleItems.map(function (item) {
                var checked = selectedIDs.indexOf(item.id) !== -1;
                return h("button", { key: item.id, type: "button", className: checked ? "selected" : "", onClick: function () { toggle(item.id); } },
                  h("span", { className: "stash-slideshow-picker-check", "aria-hidden": "true" }, checked ? "✓" : ""),
                  h("span", { className: "stash-slideshow-picker-label" }, item.label),
                  h("small", null, item.count.toLocaleString(), item.childCount ? " · " + item.childCount + " children" : "")
                );
              }) : h("div", { className: "stash-slideshow-empty" }, query ? "No matching sources with images" : "No sources with images")
            ),
            matchingItems.length > 400 ? h("small", { className: "stash-slideshow-limit-note" }, "Showing the first 400 matches. Narrow the search to see more.") : null
          ),
          h("div", { className: "stash-slideshow-source-tip" }, h("strong", null, "Tip:"), " On any Images page, open Stash’s operations menu and choose Start slideshow. It preserves that page’s filters—or uses only the images you selected.")
        ),
        h("section", { className: "stash-slideshow-card stash-slideshow-settings" },
          h("div", { className: "stash-slideshow-section-head" }, h("div", null, h("span", { className: "eyebrow" }, "2 · Customize"), h("h2", null, "Playback options")), h("button", { type: "button", className: "minimal", onClick: function () { commitOptions(sanitizeOptions({})); } }, "Reset")),
          h(OptionsPanel, { options: options, onChange: commitOptions, showOrdering: true }),
          h(BackgroundClipSetup, { options: options, onChange: commitOptions }),
          h("button", { type: "button", className: "stash-slideshow-start", disabled: busy || (scope !== "all" && !selectedIDs.length), onClick: startBuilderSource }, busy ? status || "Loading…" : "Start slideshow"),
          status && !busy ? h("p", { className: "stash-slideshow-status" }, status) : null
        )
      )
    );
  }

  function registerPatches(api) {
    if (!api.patch || window.__stashImageSlideshowPatches) return;
    window.__stashImageSlideshowPatches = true;

    api.patch.before("FilteredImageList", function (props) {
      var current = props || {};
      var operations = current.extraOperations || [];
      if (operations.some(function (operation) { return operation && operation.__stashImageSlideshow; })) return [current];
      var slideshowOperation = {
        __stashImageSlideshow: true,
        text: "Start slideshow",
        onClick: function (result, _filter, selectedIds) {
          launchSource(sourceFromCurrentList(result, selectedIds));
          return Promise.resolve();
        },
        isDisplayed: function (result) {
          return !!(result && result.data && result.data.findImages && result.data.findImages.count > 0);
        }
      };
      return [Object.assign({}, current, { extraOperations: [slideshowOperation].concat(operations) })];
    });

    if (api.patch.before) {
      api.patch.before("MainNavBar.UtilityItems", function (props) {
        var NavLink = api.libraries && api.libraries.ReactRouterDOM ? api.libraries.ReactRouterDOM.NavLink : "a";
        var Button = api.libraries && api.libraries.Bootstrap ? api.libraries.Bootstrap.Button : "button";
        var linkProps = NavLink === "a" ? { className: "nav-utility", href: ROUTE } : { className: "nav-utility", exact: true, to: ROUTE };
        return [{
          children: h(React.Fragment, null, props.children,
            h(NavLink, linkProps,
              h(Button, { className: "minimal d-flex align-items-center h-100 stash-slideshow-nav", title: "Image slideshow" }, icon("slideshow"))
            )
          )
        }];
      });
    }
  }

  function exposeAPI() {
    window.StashImageSlideshow = {
      version: VERSION,
      route: ROUTE,
      open: launchSource,
      gallery: function (id) { launchSource(Object.assign(sourceForScope("gallery", [id], false, loadOptions()), { label: "Gallery slideshow" })); },
      tag: function (id, includeDescendants) { launchSource(Object.assign(sourceForScope("tag", [id], includeDescendants !== false, loadOptions()), { label: "Tag-family slideshow" })); },
      studio: function (id, includeDescendants) { launchSource(Object.assign(sourceForScope("studio", [id], includeDescendants !== false, loadOptions()), { label: "Studio slideshow" })); },
      performer: function (id) { launchSource(Object.assign(sourceForScope("performer", [id], false, loadOptions()), { label: "Performer slideshow" })); },
      _test: {
        sanitizeOptions: sanitizeOptions,
        galleryLabel: galleryLabel,
        sourceForScope: sourceForScope,
        normalizeSource: normalizeSource,
        shuffledCopy: shuffledCopy,
        sourceFromCurrentList: sourceFromCurrentList,
        nextIndex: nextIndex,
        sanitizeBackgroundClip: sanitizeBackgroundClip,
        formatMediaTime: formatMediaTime,
        sceneClip: sceneClip,
        audioClip: audioClip,
        sortCatalogItems: sortCatalogItems,
        classifyMediaError: classifyMediaError,
        createWaveformController: createWaveformController,
        seekMediaBy: seekMediaBy,
        setMediaPlaybackRate: setMediaPlaybackRate
      }
    };
  }

  function bootstrap() {
    var api = window.PluginApi;
    if (!api || !api.React || !api.register || !api.register.route) return false;
    React = api.React;
    h = React.createElement;
    if (!window.__stashImageSlideshowRoute) {
      window.__stashImageSlideshowRoute = true;
      api.register.route(ROUTE, SlideshowPage);
    }
    registerPatches(api);
    exposeAPI();
    console.info("[Native Image Slideshow] v" + VERSION + " ready");
    return true;
  }

  if (!bootstrap()) {
    var attempts = 0;
    var timer = window.setInterval(function () {
      attempts += 1;
      if (bootstrap() || attempts > 100) window.clearInterval(timer);
    }, 100);
  }
})();
