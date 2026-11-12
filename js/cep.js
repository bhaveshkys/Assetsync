/* Minimal bridge to the host app (replaces Adobe's CSInterface.js). */
(function () {
  var cep = window.__adobe_cep__;

  window.Host = {
    available: !!cep,
    /** Run ExtendScript in Premiere/AE, resolves with the string result. */
    eval: function (script) {
      return new Promise(function (resolve) {
        if (!cep) return resolve("");
        cep.evalScript(script, function (res) { resolve(res == null ? "" : String(res)); });
      });
    },
    /** Call a function defined in jsx/host.jsx with JSON-able args. */
    call: function (fn) {
      var args = Array.prototype.slice.call(arguments, 1).map(function (a) { return JSON.stringify(a); });
      return Host.eval("AS." + fn + "(" + args.join(",") + ")");
    },
    hostId: function () {
      try { return JSON.parse(cep.getHostEnvironment()).appId; } catch (e) { return "?"; }
    }
  };

  // Node is available because of --enable-nodejs --mixed-context in the manifest.
  window.nodeRequire = (window.cep_node && window.cep_node.require) || window.require;
})();
