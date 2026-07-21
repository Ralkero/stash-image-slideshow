const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadPlugin() {
  const patches = { before: {}, after: {} };
  const routes = {};
  const storage = new Map();
  const React = {
    Fragment: "fragment",
    createElement(type, props, ...children) { return { type, props: props || {}, children }; }
  };
  const window = {
    PluginApi: {
      React,
      register: { route(route, component) { routes[route] = component; } },
      patch: {
        before(name, fn) { patches.before[name] = fn; },
        after(name, fn) { patches.after[name] = fn; }
      },
      libraries: {}
    },
    localStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); } },
    sessionStorage: { getItem(key) { return storage.get(key) || null; }, setItem(key, value) { storage.set(key, value); }, removeItem(key) { storage.delete(key); } },
    location: { pathname: "/", origin: "http://127.0.0.1:9999", assign() {} },
    history: { state: {}, pushState() {} },
    dispatchEvent() {},
    setInterval,
    clearInterval,
    console
  };
  window.window = window;
  const context = {
    window,
    document: { title: "Images - Stash", querySelector() { return null; } },
    console,
    URL,
    fetch() { throw new Error("fetch should not run during unit tests"); },
    PopStateEvent: function () {},
    CustomEvent: function () {},
    setInterval,
    clearInterval
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, "..", "stash-image-slideshow.js"), "utf8");
  vm.runInContext(source, context);
  return { api: window.StashImageSlideshow, patches, routes };
}

test("registers the native route and integration patches", () => {
  const loaded = loadPlugin();
  assert.equal(typeof loaded.routes["/plugins/image-slideshow"], "function");
  assert.equal(typeof loaded.patches.before.FilteredImageList, "function");
});

test("vendored WaveSurfer v7 exposes only the required Timeline and Hover plugin dependencies", () => {
  const context = {};
  vm.createContext(context);
  for (const file of ["wavesurfer.min.js", "timeline.min.js", "hover.min.js"]) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "vendor", file), "utf8"), context);
  }
  assert.equal(typeof context.WaveSurfer.create, "function");
  assert.equal(typeof context.WaveSurfer.Timeline.create, "function");
  assert.equal(typeof context.WaveSurfer.Hover.create, "function");
  assert.equal(context.WaveSurfer.Spectrogram, undefined);
  assert.equal(context.WaveSurfer.Minimap, undefined);
  assert.equal(context.WaveSurfer.Regions, undefined);
});

test("manifest dependency order and responsive player styles are packaged", () => {
  const manifest = fs.readFileSync(path.join(__dirname, "..", "stash-image-slideshow.yml"), "utf8");
  const css = fs.readFileSync(path.join(__dirname, "..", "stash-image-slideshow.css"), "utf8");
  const core = manifest.indexOf("vendor/wavesurfer.min.js");
  const timeline = manifest.indexOf("vendor/timeline.min.js");
  const hover = manifest.indexOf("vendor/hover.min.js");
  const plugin = manifest.indexOf("stash-image-slideshow.js");
  assert.ok(core >= 0 && core < timeline && timeline < hover && hover < plugin);
  assert.match(css, /\.stash-slideshow-wave-player/);
  assert.match(css, /\.stash-slideshow-player:fullscreen/);
  assert.match(css, /height: 100dvh/);
  assert.match(css, /@media \(max-width: 760px\)/);
  assert.match(css, /@media \(max-width: 560px\)/);
});

test("sanitizes persisted playback options", () => {
  const { api } = loadPlugin();
  const options = api._test.sanitizeOptions({
    displaySeconds: 999,
    transition: "wipe",
    transitionSeconds: -2,
    fit: "cover",
    background: "not-a-color",
    backgroundVolume: 3,
    backgroundClip: { id: 44, label: "Audio scene", stream: "/scene/44/stream", duration: 95 },
    direction: "DESC"
  });
  assert.equal(options.displaySeconds, 60);
  assert.equal(options.transition, "fade");
  assert.equal(options.transitionSeconds, 0);
  assert.equal(options.fit, "cover");
  assert.equal(options.background, "#090b10");
  assert.equal(options.backgroundVolume, 1);
  assert.equal(options.backgroundClip.id, "44");
  assert.equal(options.backgroundClip.stream, "/scene/44/stream");
  assert.equal(options.direction, "DESC");
});

test("normalizes scene clips and media timestamps", () => {
  const { api } = loadPlugin();
  const clip = api._test.sceneClip({
    id: 3819,
    title: "",
    paths: { stream: "/scene/3819/stream", screenshot: "/scene/3819/screenshot" },
    files: [{ basename: "Full Audio.mp4", duration: 3723.8 }]
  });
  assert.equal(clip.label, "Full Audio.mp4");
  assert.equal(clip.duration, 3723.8);
  assert.equal(api._test.formatMediaTime(3723.8), "1:02:03");
  assert.equal(api._test.sanitizeBackgroundClip({ id: "1" }), null);
});

test("filters empty slideshow sources and sorts the rest", () => {
  const { api } = loadPlugin();
  const input = [
    { id: "1", label: "Zeta", count: 2 },
    { id: "2", label: "Empty video-only group", count: 0 },
    { id: "3", label: "Alpha", count: 12 },
    { id: "4", label: "Beta", count: 2 }
  ];
  assert.deepEqual(api._test.sortCatalogItems(input, "name-asc").map((item) => item.id), ["3", "4", "1"]);
  assert.deepEqual(api._test.sortCatalogItems(input, "name-desc").map((item) => item.id), ["1", "4", "3"]);
  assert.deepEqual(api._test.sortCatalogItems(input, "count-desc").map((item) => item.id), ["3", "4", "1"]);
  assert.deepEqual(api._test.sortCatalogItems(input, "count-asc").map((item) => item.id), ["4", "1", "3"]);
  assert.equal(input.length, 4);
});

test("builds hierarchical tag and gallery image filters", () => {
  const { api } = loadPlugin();
  const tag = api._test.sourceForScope("tag", ["10", "12"], true, { sort: "path", direction: "ASC" });
  assert.deepEqual(JSON.parse(JSON.stringify(tag.imageFilter.tags)), { value: ["10", "12"], modifier: "INCLUDES", depth: -1 });
  const gallery = api._test.sourceForScope("gallery", ["44"], false, { sort: "title", direction: "DESC" });
  assert.deepEqual(JSON.parse(JSON.stringify(gallery.imageFilter.galleries)), { value: ["44"], modifier: "INCLUDES" });
  assert.equal(gallery.findFilter.sort, "title");
  assert.equal(gallery.findFilter.direction, "DESC");
});

test("uses selected IDs before the current list filter", () => {
  const { api } = loadPlugin();
  const selected = api._test.sourceFromCurrentList({ variables: { image_filter: { organized: true } } }, new Set(["8", "9"]));
  assert.deepEqual(JSON.parse(JSON.stringify(selected.ids)), ["8", "9"]);
  const single = api._test.sourceFromCurrentList({ variables: {} }, new Set(["8"]));
  assert.equal(single.label, "1 selected image");
  const filtered = api._test.sourceFromCurrentList({ variables: { image_filter: { organized: true }, filter: { sort: "date" } } }, new Set());
  assert.deepEqual(JSON.parse(JSON.stringify(filtered.imageFilter)), { organized: true });
  assert.equal(filtered.findFilter.sort, "date");
});

test("shuffle returns a copy and preserves every image", () => {
  const { api } = loadPlugin();
  const input = [1, 2, 3, 4];
  const output = api._test.shuffledCopy(input, () => 0);
  assert.deepEqual(input, [1, 2, 3, 4]);
  assert.deepEqual([...output].sort(), input);
  assert.notDeepEqual(output, input);
});

test("next image calculation wraps only when loop is enabled", () => {
  const { api } = loadPlugin();
  assert.equal(api._test.nextIndex(2, 1, 3, true), 0);
  assert.equal(api._test.nextIndex(0, -1, 3, true), 2);
  assert.equal(api._test.nextIndex(2, 1, 3, false), 2);
  assert.equal(api._test.nextIndex(0, -1, 3, false), 0);
});

function createFakeMedia() {
  const listeners = new Map();
  return {
    duration: 120,
    currentTime: 0,
    error: null,
    addEventListener(name, listener) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(listener);
    },
    removeEventListener(name, listener) {
      if (listeners.has(name)) listeners.get(name).delete(listener);
    },
    dispatch(name) {
      for (const listener of listeners.get(name) || []) listener({ currentTarget: this });
    },
    listenerCount() {
      return [...listeners.values()].reduce((total, group) => total + group.size, 0);
    }
  };
}

function createFakeWaveSurferVendor() {
  const instances = [];
  const vendor = {
    Timeline: { create(options) { return { kind: "timeline", options }; } },
    Hover: { create(options) { return { kind: "hover", options }; } },
    create(options) {
      const events = new Map();
      const instance = {
        options,
        destroyed: false,
        loaded: [],
        on(name, listener) {
          if (!events.has(name)) events.set(name, new Set());
          events.get(name).add(listener);
          return () => events.get(name).delete(listener);
        },
        emit(name, value) {
          for (const listener of events.get(name) || []) listener(value);
        },
        load(source) {
          this.loaded.push(source);
          return Promise.resolve();
        },
        destroy() {
          this.destroyed = true;
          events.clear();
        }
      };
      instances.push(instance);
      if (options.url) instance.load(options.url);
      return instance;
    }
  };
  return { vendor, instances };
}

test("WaveSurfer uses the existing audio element with Timeline, Hover, and drag seeking", () => {
  const { api } = loadPlugin();
  const media = createFakeMedia();
  const { vendor, instances } = createFakeWaveSurferVendor();
  const states = [];
  const controller = api._test.createWaveformController({
    media,
    container: {},
    timelineContainer: {},
    source: "/audio/1/stream",
    vendor,
    onState(state) { states.push(state); }
  });

  assert.equal(instances.length, 1);
  assert.equal(instances[0].options.media, media);
  assert.equal(instances[0].options.url, "/audio/1/stream");
  assert.equal(instances[0].options.dragToSeek, true);
  assert.deepEqual(Array.from(instances[0].options.plugins, (plugin) => plugin.kind), ["timeline", "hover"]);
  assert.deepEqual(instances[0].loaded, ["/audio/1/stream"]);
  instances[0].emit("loading", 48);
  instances[0].emit("ready", 120);
  assert.equal(states.at(-1).kind, "ready");
  controller.destroy();
  assert.equal(instances[0].destroyed, true);
  assert.equal(media.listenerCount(), 0);
});

test("rapid source replacement destroys the old WaveSurfer and prevents duplicate listeners", () => {
  const { api } = loadPlugin();
  const media = createFakeMedia();
  const { vendor, instances } = createFakeWaveSurferVendor();
  const base = { media, container: {}, timelineContainer: {}, vendor };
  const first = api._test.createWaveformController({ ...base, source: "/audio/1/stream" });
  assert.equal(media.listenerCount(), 5);
  const second = api._test.createWaveformController({ ...base, source: "/audio/2/stream" });
  assert.equal(instances[0].destroyed, true);
  assert.equal(media.listenerCount(), 5);
  first.destroy();
  assert.equal(media.listenerCount(), 5);
  second.destroy();
  assert.equal(media.listenerCount(), 0);
});

test("waveform initialization and unsupported audio failures select the native fallback", () => {
  const { api } = loadPlugin();
  const media = createFakeMedia();
  const states = [];
  const missingVendor = api._test.createWaveformController({
    media,
    container: {},
    timelineContainer: {},
    source: "/audio/1/stream",
    vendor: null,
    logErrors: false,
    onState(state) { states.push(state); }
  });
  assert.equal(missingVendor.instance, null);
  assert.equal(states.at(-1).kind, "fallback");

  const mocked = createFakeWaveSurferVendor();
  const unsupportedStates = [];
  const controller = api._test.createWaveformController({
    media,
    container: {},
    timelineContainer: {},
    source: "/audio/2/stream",
    vendor: mocked.vendor,
    logErrors: false,
    onState(state) { unsupportedStates.push(state); }
  });
  media.error = { code: 4 };
  media.dispatch("error");
  assert.equal(unsupportedStates.at(-1).kind, "unsupported");
  assert.equal(mocked.instances[0].destroyed, true);
  assert.equal(media.listenerCount(), 0);
  controller.destroy();
});

test("classifies autoplay, decode, and unsupported playback errors clearly", () => {
  const { api } = loadPlugin();
  assert.equal(api._test.classifyMediaError({ error: null }, { name: "NotAllowedError" }).kind, "blocked");
  assert.equal(api._test.classifyMediaError({ error: { code: 3 } }).message, "The browser could not decode this audio file.");
  assert.equal(api._test.classifyMediaError({ error: { code: 4 } }).kind, "unsupported");
});

test("audio seeking and playback speed stay on the shared media element", () => {
  const { api } = loadPlugin();
  const media = { currentTime: 5, duration: 20, playbackRate: 1 };
  assert.equal(api._test.seekMediaBy(media, -10, 0), 0);
  assert.equal(media.currentTime, 0);
  assert.equal(api._test.seekMediaBy(media, 10, 0), 10);
  assert.equal(api._test.seekMediaBy(media, 30, 0), 20);
  assert.equal(api._test.setMediaPlaybackRate(media, 1.5), 1.5);
  assert.equal(media.playbackRate, 1.5);
  assert.equal(api._test.setMediaPlaybackRate(media, 9), 2);
});
