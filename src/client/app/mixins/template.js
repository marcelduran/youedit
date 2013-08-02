'use strict';

define([], function() {

  function template() {

    var cache = {},
        reOpenTag = /\{\{/g,
        reCloseTag = /\}\}/g;

    function value(key, data) {
      var obj = data;
      key.split('.').forEach(function(key) {
        obj = obj[key];
      });
      return obj;
    }

    this.template = function(tmpl, data) {
      var render = cache[tmpl];

      if (!render) {
        cache[tmpl] = render = new Function(['d'],
           "return '" + tmpl.replace(/'/g, "\\'")
            .replace(reOpenTag, "'+d.")
            .replace(reCloseTag, "+'") + "'"
        );
      }

      return render(data);
    }

  }

  return template;

});
