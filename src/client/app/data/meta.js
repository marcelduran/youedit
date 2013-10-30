'use strict';

define([
  'flight/lib/component',
  'mixins/params'
], function(component, params) {

  function meta() {

    var
      reValid = /[vaiobe]/, // v|a = video|audio id, i|b = IN, o|e = OUT
      rePos = /[iobe]/, // clips position: i = IN, o = OUT
      reDigit = /^\d+$/; // 1 or more digit only, eg: 0, 1, 12

    this.parseMetainfo = function() {
      var qs,
          data = {},
          s = location.search,
          h = location.hash,
          hash = h.slice(1).split('&'),
          idx = s.lastIndexOf('/'),
          fromBase64 = this.fromBase64;

      // remove heading "?" and trailing "/"
      idx = idx > -1 ? idx : s.length;
      qs = s.slice(1, idx).split('&');

      // parse querystring and hash, hash overrides
      qs.concat(hash).forEach(function(entry) {
        var kv = entry.split('='),
            key = decodeURIComponent(kv[0]).charAt(0),
            val = decodeURIComponent(kv[1]);

        // skip invalid parameters
        if (!reValid.test(key)) {
          return;
        }

        // get parameters
        if (rePos.test(key)) {

          // in/out positions
          data[key] = val.split('!').map(function(block) {
            var last;

            return block.split('.').map(function(n) {
              n = (n === '~' ? last : fromBase64(n));
              last = n;

              return n;
            });
          });

        } else {

          // video|audio ids
          data[key] = val.split('.').map(function(v, i, a) {
            // check video id shortcuts
            return reDigit.test(v) ? a[v] : v;
          });

        }

      });

      this.trigger('metainfoParsed', data);
    };
    
    this.after('initialize', function() {
      this.parseMetainfo();
    });

  }

  return component(meta, params);

});
