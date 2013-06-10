'use strict';

define([], function() {

  function time() {
    var timeRegExp = /(\d+:)?(\d+):(\d+)/;

    this.prettyTime = function (s) {
      var h, m, ss, hour, min;

      if (isNaN(s)) {
        return s;
      }

      h = parseInt(s / 3600, 10);
      m = parseInt((s % 3600) / 60, 10);
      ss = s - (m * 60) - (h * 3600);
      hour = s >= 3600;
      min = s >= 60;

      return (hour ? h + ':' : '') +
             (min ? (m < 10 && hour ? '0' : '') + m + ':' : '') +
             (!min ? '0:' : '') +
             (ss < 10 ? '0' : '') + ss;
    };

    this.timeToSec = function(t) {
      var match = timeRegExp.exec(t),
          h = parseInt(match[1], 10) || 0,
          m = parseInt(match[2], 10) || 0,
          s = parseInt(match[3], 10) || 0;

      return (h * 3600) + (m * 60) + s; 
    };

  }

  return time;

});
