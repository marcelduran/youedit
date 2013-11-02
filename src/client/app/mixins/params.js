'use strict';

define(function() {

  function params() {

    this.defaultAttrs({
      parseSeparator: '.',
      parseGroup: '!',
      parseMultiplier: '*'
    });

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

    this.minifyMarks = function(marks, bound) {
      var i, len, mark, last, times,
          minified = [];

      // loop all marks
      for (i = 0, len = marks.length; i <= len; i++) {
        mark = marks[i];

        // init once
        if (last === undefined) {
          last = mark;
          times = 0;
        }

        // mark change
        if (mark !== last) {
          // encode value base64
          last = last === bound ? '' : this.toBase64(last);
          if (times > 1) {
            // append multiplier to value
            last += this.attr.parseMultiplier + this.toBase64(times);
          }
          // dump value
          minified.push(last);

          // reset
          last = mark;
          times = 0;
        }

        times++;
      }

      return minified.join(this.attr.parseSeparator);
    };

    this.toQueryString = function(tracks, keys) {
      var i, len, track, id, ids, from, to, index, videoId,
          obj = {},
          res = [];
      
      // initialize querystring object representation
      ids = obj[keys.id] = [];
      obj[keys.markIn] = [];
      obj[keys.markOut] = [];

      // loop all tracks
      for (i = 0, len = tracks.length; i <= len; i++) {
        track = tracks[i];
        videoId = track && track.video.id;

        // init once
        if (id === undefined) {
          id = videoId;
          from = [];
          to = [];
        }

        // id change
        if (id !== videoId) {
          // dump marks
          obj[keys.markIn].push(this.minifyMarks(from, 0));
          obj[keys.markOut].push(this.minifyMarks(to, Infinity));

          // dump id
          index = ids.indexOf(id);
          ids.push(index > -1 ? index : id);

          // reset
          id = videoId;
          from = [];
          to = [];
        }

        if (track) {
          from.push(track.from);
          to.push(track.to === track.video.duration ? Infinity : track.to);
        }
      }
      
      Object.keys(obj).forEach(function(key) {
        if (obj[key].length) {
          res.push(key + '=' + obj[key].join(this.attr.parseSeparator));
        }
      }.bind(this));

      return res.join('&');
    };

  }

  return params;

});
