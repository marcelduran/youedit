'use strict';

var url = require('url');

var sample = 'http://youed.it/foo_fighters?v=SBjQ9tuuTJQ.4PkcfQtibmU&i=14!2G.33.~&o=1C!2N.39.45';

var parsed = url.parse(sample, true);

// regular expressions
var reDoubleUnderscores = /\_\_/g,
    reSingleUnderscore = /\_/g,
    reLineBreak = /\n/g,
    reYoutubeId = /[a-zA-Z0-9_\-]{11}/;

// convert base 10 numbers into base 64
// e.g.: 0 -> 0, 10 -> a, 61 -> Z, 62 -> -, 63 -> _
function base10To64(n) {
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
    c = code(r + (r < 10 ? 48 : r < 36 ? 55 : r < 62 ? 61 : r < 63 ? -17 : 32));
    result = c.toString() + result;
  }

  return result;
}
console.log(base10To64(135));

// convert base 64 numbers into base 10.
// e.g.: 0 -> 0, a -> 10, Z -> 61, - -> 62, _ -> 63
function base64To10(n) {
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
}

// title parser
function title(encodedTitle) {
  return decodeURIComponent(encodedTitle)
    .replace(reDoubleUnderscores, '\n')
    .replace(reSingleUnderscore, ' ')
    .replace(reLineBreak, '_');
}

// ids (video or audio) parser
function ids(source) {
  source = source.split('.');
  source.forEach(function eachId(id, index) {
    if (!reYoutubeId.test(id)) {
      id = base64To10(id);
      source[index] = source[id];
    }
  });

  return source;
}

// clips (video|audio) (in|out) marks
function clips(source, array, type, input, bound) {
  var last, rangeStart,
      index = 0,
      length = 0;
  if (type === 'out') {
    rangeStart = 'in';
  }
  input.split('!').forEach(function eachInGroup(group, idx) {
    var id = source[idx];
    if (!id) {
      return;
    }
    group.split('.').forEach(function eachItem(item) {
      var len, value,
          obj = array[index] || {id: id};

      item = item.split('*');
      len = (item[1] && base64To10(item[1])) || 1;
      value = item[0];
      value = last =
        value === '' ? bound : value === '~' ? last : base64To10(value);
      while (len--) {
        if (rangeStart) {
          obj.from = length;
          obj.to = length + (value - obj[rangeStart]);
        }
        length = obj.to + 1;
        obj[type] = value;
        array[index] = obj;
        index += 1;
      }
    });
  });
}

var mixTitle, videoIds, videoClips;

mixTitle = title(decodeURIComponent(parsed.pathname.slice(1).trim()));
console.log('title:', mixTitle);
videoIds = ids(parsed.query.v);
console.log('video ids:', videoIds);
//clips(videoIds, videoClips, 'inn', '1.2!3*6.4', 0);
//clips(videoIds, videoClips, 'out', '2.3!4*6.5', 0);
clips(videoIds, videoClips, 'in', parsed.query.i, 0);
clips(videoIds, videoClips, 'out', parsed.query.o, Infinity);

console.log('videoClips:', videoClips);
