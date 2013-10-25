'use strict';

define(['mixins/encoding'], function(encoding) {

  function params() {

    var
      // constants
      KEY_SEP = '.';

    // convert base 10 numbers into base 64
    // e.g.: 0 -> 0, 10 -> a, 61 -> Z, 62 -> -, 63 -> _ 
    this.toBase64 = function(n) {
      var r, c,
          q = n,
          result = '',
          code = String.fromCharCode;
      
      if (n === 0) {
        return '0';
      }
      
      while (q > 0) {
        r = q % 64;
        q = parseInt(q / 64, 10);
        c = code(
          r + (r < 10 ? 48 : r < 36 ? 55 : r < 62 ? 61 : r < 63 ? -17 : 32)
        );
        result = c.toString() + result;
      }
      
      return result;
    };

    // convert base 64 numbers into base 10.
    // e.g.: 0 -> 0, a -> 10, Z -> 61, - -> 62, _ -> 63 
    this.fromBase64 = function(n) {
      var i, c, x,
          result = 0,
          len = n.length - 1,
          pow = Math.pow;
      
      for (i = len; i >= 0; i -= 1) {
        c = n.charCodeAt(i);
        x = c - (c < 48 ? -17 : c < 65 ? 48 : c < 91 ? 55 : c < 96 ? 32 : 61);
        result += x * pow(64, len - i);
      }
      
      return result;
    };

    this.toQueryString = function(list, keys) {
      var ids,
          obj = {},
          res = [];
      
      ids = obj[keys.id] = [];
      obj[keys.markIn] = [];
      obj[keys.markOut] = [];

      list.forEach(function(track) {
        //var index = ids.indexOf(track.video.id);
        //ids.push(index > -1 ? index : track.video.id);
        
        ids.push(track.video.id);
        obj[keys.markIn].push(this.toBase64(track.from));
        obj[keys.markOut].push(this.toBase64(track.to));
      }.bind(this));
      
      Object.keys(obj).forEach(function(key) {
        if (obj[key].length) {
          res.push(key + '=' + obj[key].join(KEY_SEP));
        }
      });

      return res.join('&');
    };

  }

  return params;

});
