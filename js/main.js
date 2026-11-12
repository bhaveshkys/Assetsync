/* Panel UI + orchestration: one watcher per folder, per project. */
(function () {
  var path = nodeRequire("path");

  var DEFAULT_EXT = [
    "jpg", "jpeg", "png", "gif", "tif", "tiff", "psd", "ai", "eps", "bmp", "webp", "heic", "exr", "tga", "dpx",
    "mp4", "mov", "m4v", "avi", "mxf", "mts", "m2ts", "webm", "r3d", "braw",
    "wav", "mp3", "aif", "aiff", "m4a", "aac", "flac", "ogg"
  ];

  var $ = function (id) { return document.getElementById(id); };
  var state = {
    projectPath: null,
    folders: [],          // [{ path, enabled, mirror }]
    watchers: {},         // path -> FolderWatcher
    settings: loadJSON("assetsync:settings", { extensions: DEFAULT_EXT.join(", "), rescanSec: 60 })
  };
  var importChain = Promise.resolve();

  // ---------- persistence ----------
  function loadJSON(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} }
  function projectKey() { return "assetsync:project:" + (state.projectPath || "untitled"); }
  function saveFolders() { saveJSON(projectKey(), state.folders); }
  function extSet() {
    return new Set(state.settings.extensions.split(/[\s,;]+/).map(function (s) {
      return s.replace(/^\./, "").toLowerCase();
    }).filter(Boolean));
  }

  // ---------- logging ----------
  function log(msg, kind) {
    var li = document.createElement("li");
    var t = new Date().toTimeString().slice(0, 8);
    li.innerHTML = '<span class="t">' + t + '</span><span class="' + (kind || "info") + '"></span>';
    li.lastChild.textContent = msg;
    li.title = msg;
    var ul = $("log");
    ul.insertBefore(li, ul.firstChild);
    while (ul.children.length > 200) ul.removeChild(ul.lastChild);
  }

  function setDot(kind) { $("dot").className = "dot " + kind; }
  function refreshDot() {
    var any = state.folders.some(function (f) { return f.enabled && state.watchers[f.path]; });
    setDot(any ? "on" : "off");
  }

  // ---------- importing ----------
  function importFiles(folder, files) {
    importChain = importChain.then(function () {
      setDot("busy");
      var root = path.basename(folder.path);
      var items = files.map(function (f) {
        return { path: f.path, bin: [root].concat(folder.mirror ? f.dirs : []) };
      });
      return Host.call("importFiles", items).then(function (res) {
        var r; try { r = JSON.parse(res); } catch (e) { r = { error: res || "No response from host" }; }
        if (r.error) log("Import failed: " + r.error, "err");
        (r.imported || []).forEach(function (p) { log("Imported " + path.relative(folder.path, p), "ok"); });
        (r.failed || []).forEach(function (p) { log("Could not import " + path.basename(p), "err"); });
        refreshDot();
      });
    }).catch(function (e) { log(String(e), "err"); refreshDot(); });
  }

  // ---------- watchers ----------
  function startWatcher(folder) {
    stopWatcher(folder.path);
    if (!folder.enabled) return;
    if (!FolderWatcher.exists(folder.path)) { log("Folder missing: " + folder.path, "err"); return; }
    var w = new FolderWatcher(folder.path, {
      extensions: extSet(),
      onFiles: function (files) { importFiles(folder, files); },
      onError: function (e) { log("Watcher error (" + path.basename(folder.path) + "): " + e.message, "err"); }
    });
    if (w.start(Number(state.settings.rescanSec) || 0)) state.watchers[folder.path] = w;
  }
  function stopWatcher(p) {
    if (state.watchers[p]) { state.watchers[p].stop(); delete state.watchers[p]; }
  }
  function restartAll() {
    Object.keys(state.watchers).forEach(stopWatcher);
    state.folders.forEach(startWatcher);
    render();
  }

  // ---------- UI ----------
  function render() {
    var ul = $("folders");
    ul.innerHTML = "";
    $("empty").classList.toggle("hidden", state.folders.length > 0);
    state.folders.forEach(function (f, i) {
      var li = document.createElement("li");
      if (!f.enabled) li.className = "paused";
      li.innerHTML =
        '<div class="top"><span class="dot ' + (state.watchers[f.path] ? "on" : "off") + '"></span>' +
        '<span class="name"></span></div>' +
        '<div class="path"></div>' +
        '<div class="opts">' +
        '<label><input type="checkbox" data-act="mirror"' + (f.mirror ? " checked" : "") + '> Mirror subfolders as bins</label>' +
        '<span style="flex:1"></span>' +
        '<button data-act="toggle">' + (f.enabled ? "Pause" : "Resume") + '</button>' +
        '<button data-act="remove">Remove</button></div>';
      li.querySelector(".name").textContent = path.basename(f.path);
      li.querySelector(".path").textContent = f.path;
      li.querySelector(".path").title = f.path;
      li.addEventListener("click", function (ev) {
        var act = ev.target.getAttribute("data-act");
        if (act === "toggle") { f.enabled = !f.enabled; startWatcher(f); if (!f.enabled) stopWatcher(f.path); }
        else if (act === "remove") { stopWatcher(f.path); state.folders.splice(i, 1); }
        else if (act === "mirror") { f.mirror = ev.target.checked; }
        else return;
        saveFolders(); render(); refreshDot();
      });
      ul.appendChild(li);
    });
    refreshDot();
  }

  function addFolder() {
    var pickPromise;
    try {
      if (window.cep && window.cep.fs && window.cep.fs.showOpenDialogEx) {
        var r = window.cep.fs.showOpenDialogEx(false, true, "Choose an asset folder to watch", "");
        var picked = (r && r.data && r.data.length) ? r.data[0] : "";
        pickPromise = Promise.resolve(picked);
      } else {
        pickPromise = Host.call("pickFolder");
      }
    } catch (e) {
      pickPromise = Host.call("pickFolder");
    }
    pickPromise.then(function (p) {
      if (!p) return;
      p = path.resolve(p);
      if (state.folders.some(function (f) { return f.path === p; })) { log("Already watching " + p, "info"); return; }
      var f = { path: p, enabled: true, mirror: true };
      state.folders.push(f);
      saveFolders();
      log("Watching " + p, "ok");
      startWatcher(f);
      render();
    });
  }

  function syncNow() {
    log("Full sync…", "info");
    state.folders.forEach(function (f) {
      var w = state.watchers[f.path];
      if (w) { w.reset(); w.scan(); }
    });
  }

  // ---------- project tracking ----------
  function pollProject() {
    Host.call("projectPath").then(function (p) {
      p = p ? path.normalize(p) : "";
      if (p === state.projectPath) return;
      state.projectPath = p;
      $("project").textContent = p ? path.basename(p) : "Unsaved project";
      $("project").title = p;
      state.folders = loadJSON(projectKey(), []);
      if (p) log("Project: " + path.basename(p), "info");
      restartAll();
    });
  }

  // ---------- boot ----------
  $("addBtn").onclick = addFolder;
  $("syncBtn").onclick = syncNow;
  $("clearLog").onclick = function () { $("log").innerHTML = ""; };
  $("settingsBtn").onclick = function () {
    $("extInput").value = state.settings.extensions;
    $("rescanInput").value = state.settings.rescanSec;
    $("settings").classList.toggle("hidden");
  };
  $("saveSettings").onclick = function () {
    state.settings.extensions = $("extInput").value;
    state.settings.rescanSec = Math.max(0, Number($("rescanInput").value) || 0);
    saveJSON("assetsync:settings", state.settings);
    $("settings").classList.add("hidden");
    log("Settings saved", "ok");
    restartAll();
  };

  if (!Host.available) { log("Not running inside Premiere/After Effects", "err"); return; }
  log("AssetSync ready in " + Host.hostId(), "info");
  pollProject();
  setInterval(pollProject, 2000);
})();
