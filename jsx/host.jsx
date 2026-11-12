/* AssetSync host script — runs inside Premiere Pro or After Effects (ExtendScript, ES3). */
var AS = AS || {};

AS.isPPro = function () { return BridgeTalk.appName === "premierepro"; };

AS.norm = function (p) { return String(p).replace(/\\/g, "/").toLowerCase(); };

AS.q = function (s) {
  return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "").replace(/\n/g, "\\n") + '"';
};
AS.list = function (arr) {
  var out = [];
  for (var i = 0; i < arr.length; i++) out.push(AS.q(arr[i]));
  return "[" + out.join(",") + "]";
};

AS.projectPath = function () {
  try {
    if (AS.isPPro()) return (app.project && app.project.path) ? app.project.path : "";
    return (app.project && app.project.file) ? app.project.file.fsName : "";
  } catch (e) { return ""; }
};

AS.pickFolder = function () {
  var f = Folder.selectDialog("Choose an asset folder to watch");
  return f ? f.fsName : "";
};

/* ---------------- Premiere Pro ---------------- */

AS.ppCollect = function (item, map) {
  for (var i = 0; i < item.children.numItems; i++) {
    var c = item.children[i];
    if (c.type === ProjectItemType.BIN) { AS.ppCollect(c, map); continue; }
    try { var p = c.getMediaPath(); if (p) map[AS.norm(p)] = true; } catch (e) {}
  }
  return map;
};

AS.ppFindBin = function (parent, name) {
  for (var i = 0; i < parent.children.numItems; i++) {
    var c = parent.children[i];
    if (c.type === ProjectItemType.BIN && c.name === name) return c;
  }
  return null;
};

AS.ppBin = function (parts) {
  var cur = app.project.rootItem;
  for (var i = 0; i < parts.length; i++) {
    var next = AS.ppFindBin(cur, parts[i]);
    if (!next) { cur.createBin(parts[i]); next = AS.ppFindBin(cur, parts[i]); }
    if (!next) break;
    cur = next;
  }
  return cur;
};

AS.ppImport = function (items) {
  var have = AS.ppCollect(app.project.rootItem, {});
  var groups = {}, keys = [];
  for (var i = 0; i < items.length; i++) {
    if (have[AS.norm(items[i].path)]) continue;
    var k = items[i].bin.join("/");
    if (!groups[k]) { groups[k] = { bin: items[i].bin, paths: [] }; keys.push(k); }
    groups[k].paths.push(items[i].path);
  }
  var wanted = [];
  for (var g = 0; g < keys.length; g++) {
    var grp = groups[keys[g]];
    app.project.importFiles(grp.paths, true, AS.ppBin(grp.bin), false);
    wanted = wanted.concat(grp.paths);
  }
  return AS.report(wanted, wanted.length ? AS.ppCollect(app.project.rootItem, {}) : {});
};

/* ---------------- After Effects ---------------- */

AS.aeCollect = function () {
  var map = {};
  for (var i = 1; i <= app.project.numItems; i++) {
    var it = app.project.item(i);
    try { if (it instanceof FootageItem && it.file) map[AS.norm(it.file.fsName)] = true; } catch (e) {}
  }
  return map;
};

AS.aeFolder = function (parts) {
  var cur = app.project.rootFolder;
  for (var i = 0; i < parts.length; i++) {
    var found = null;
    for (var j = 1; j <= cur.numItems; j++) {
      var it = cur.item(j);
      if (it instanceof FolderItem && it.name === parts[i]) { found = it; break; }
    }
    if (!found) { found = app.project.items.addFolder(parts[i]); found.parentFolder = cur; }
    cur = found;
  }
  return cur;
};

AS.aeImport = function (items) {
  var have = AS.aeCollect();
  var wanted = [], ok = {};
  app.beginUndoGroup("AssetSync Import");
  try {
    for (var i = 0; i < items.length; i++) {
      var p = items[i].path;
      if (have[AS.norm(p)]) continue;
      wanted.push(p);
      try {
        var io = new ImportOptions(new File(p));
        if (io.canImportAs(ImportAsType.FOOTAGE)) io.importAs = ImportAsType.FOOTAGE;
        io.sequence = false;
        var item = app.project.importFile(io);
        if (item) { item.parentFolder = AS.aeFolder(items[i].bin); ok[AS.norm(p)] = true; }
      } catch (e) {}
    }
  } finally { app.endUndoGroup(); }
  return AS.report(wanted, ok);
};

/* ---------------- entry point ---------------- */

AS.report = function (wanted, present) {
  var imported = [], failed = [];
  for (var i = 0; i < wanted.length; i++) (present[AS.norm(wanted[i])] ? imported : failed).push(wanted[i]);
  return '{"imported":' + AS.list(imported) + ',"failed":' + AS.list(failed) + "}";
};

/** items: [{ path: "/abs/file.png", bin: ["Assets", "sub"] }] */
AS.importFiles = function (items) {
  try {
    if (!app.project) return '{"error":"No open project"}';
    return AS.isPPro() ? AS.ppImport(items) : AS.aeImport(items);
  } catch (e) {
    return '{"error":' + AS.q(e.toString() + (e.line ? " (line " + e.line + ")" : "")) + "}";
  }
};
