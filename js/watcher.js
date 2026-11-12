/* Watches one folder (recursively) and reports files once they finish writing. */
(function () {
  var fs = nodeRequire("fs");
  var path = nodeRequire("path");

  var IGNORE_SUFFIX = [".crdownload", ".part", ".partial", ".download", ".tmp", ".temp", "~", ".opdownload"];
  var IGNORE_NAMES = { ".ds_store": 1, "thumbs.db": 1, "desktop.ini": 1 };
  var IGNORE_DIRS = ["adobe premiere pro auto-save", "adobe after effects auto-save", "__macosx"];

  var STABLE_MS = 1200;          // file size must be unchanged for this long
  var GIVE_UP_MS = 30 * 60e3;    // stop waiting on a file that never settles
  var BATCH_MS = 600;            // group files that arrive together into one import

  function FolderWatcher(root, opts) {
    this.root = path.resolve(root);
    this.opts = opts;           // { extensions: Set, onFiles(files[]), onError(err) }
    this.pending = {};          // path -> timer
    this.known = {};            // path -> true (already sent for import)
    this.batch = [];
    this.batchTimer = null;
    this.fsw = null;
    this.rescanTimer = null;
  }

  FolderWatcher.prototype.accepts = function (full) {
    var rel = path.relative(this.root, full);
    if (!rel || rel.indexOf("..") === 0) return false;
    var parts = rel.split(path.sep);
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i].toLowerCase();
      if (p.charAt(0) === "." || IGNORE_NAMES[p] || IGNORE_DIRS.indexOf(p) >= 0) return false;
    }
    var name = parts[parts.length - 1].toLowerCase();
    for (var j = 0; j < IGNORE_SUFFIX.length; j++) {
      if (name.slice(-IGNORE_SUFFIX[j].length) === IGNORE_SUFFIX[j]) return false;
    }
    return this.opts.extensions.has(path.extname(name).slice(1));
  };

  FolderWatcher.prototype.start = function (rescanSec) {
    var self = this;
    this.stop();
    try {
      this.fsw = fs.watch(this.root, { recursive: true }, function (evt, name) {
        if (!name) { self.scan(); return; }   // some platforms omit the name: rescan
        self.touch(path.join(self.root, name.toString()), Date.now());
      });
      this.fsw.on("error", function (e) { self.opts.onError(e); });
    } catch (e) { this.opts.onError(e); return false; }
    if (rescanSec > 0) this.rescanTimer = setInterval(function () { self.scan(); }, rescanSec * 1000);
    this.scan();
    return true;
  };

  FolderWatcher.prototype.stop = function () {
    if (this.fsw) { try { this.fsw.close(); } catch (e) {} this.fsw = null; }
    clearInterval(this.rescanTimer);
    for (var k in this.pending) clearTimeout(this.pending[k]);
    this.pending = {};
  };

  /** Forget what was sent so the next scan re-offers everything (host dedups). */
  FolderWatcher.prototype.reset = function () { this.known = {}; };

  /** Something happened at `full`: a new file, a new folder, or a file still being written. */
  FolderWatcher.prototype.touch = function (full, since) {
    var self = this;
    fs.stat(full, function (err, st) {
      if (err) return;                        // deleted / renamed away
      if (st.isDirectory()) { self.scanDir(full); return; }  // folder dropped in
      if (self.known[full] || !self.accepts(full)) return;
      clearTimeout(self.pending[full]);
      self.pending[full] = setTimeout(function () { self.checkStable(full, st.size, st.mtimeMs, since); }, STABLE_MS);
    });
  };

  FolderWatcher.prototype.checkStable = function (full, size, mtime, since) {
    var self = this;
    fs.stat(full, function (err, st) {
      if (err) { delete self.pending[full]; return; }
      if (st.size === size && st.mtimeMs === mtime && st.size > 0) {
        delete self.pending[full];
        self.known[full] = true;
        self.queue(full);
      } else if (Date.now() - since < GIVE_UP_MS) {
        self.pending[full] = setTimeout(function () { self.checkStable(full, st.size, st.mtimeMs, since); }, STABLE_MS);
      } else {
        delete self.pending[full];
      }
    });
  };

  FolderWatcher.prototype.queue = function (full) {
    var self = this;
    this.batch.push(full);
    clearTimeout(this.batchTimer);
    this.batchTimer = setTimeout(function () {
      var files = self.batch; self.batch = [];
      files.sort();
      self.opts.onFiles(files.map(function (f) {
        var relDir = path.relative(self.root, path.dirname(f));
        return {
          path: f,
          dirs: relDir ? relDir.split(path.sep).filter(function (d) { return d && d !== "."; }) : []
        };
      }));
    }, BATCH_MS);
  };

  FolderWatcher.prototype.scan = function () { this.scanDir(this.root); };

  FolderWatcher.prototype.scanDir = function (dir) {
    var self = this;
    fs.readdir(dir, { withFileTypes: true }, function (err, entries) {
      if (err) return;
      entries.forEach(function (e) {
        var full = path.join(dir, e.name);
        if (e.isDirectory()) {
          var n = e.name.toLowerCase();
          if (n.charAt(0) !== "." && IGNORE_DIRS.indexOf(n) < 0) self.scanDir(full);
        } else if (!self.known[full] && !self.pending[full] && self.accepts(full)) {
          self.touch(full, Date.now());
        }
      });
    });
  };

  FolderWatcher.exists = function (p) {
    try { return fs.statSync(p).isDirectory(); } catch (e) { return false; }
  };

  window.FolderWatcher = FolderWatcher;
})();
