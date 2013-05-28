'use strict';

var i, character, encoded,
    candidates = [];

for (i = 0; i < 255; i += 1) {
  character = String.fromCharCode(i);
  encoded = encodeURIComponent(character);
  if (encoded === character) {
    candidates.push(character);
  }
}

candidates.forEach(function(character) {
  console.log(character);
});

console.log('total', candidates.length);
