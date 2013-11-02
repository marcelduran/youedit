'use strict';

define([
  'flight/lib/component',
  'mixins/params'
], function(component, params) {

  function meta() {

    this.defaultAttrs({
      paramMetaMap: {
        'v': 'videoId',
        'a': 'audioId',
        'i': 'videoIn',
        'o': 'videoOut',
        'b': 'audioIn',
        'e': 'audioOut'
      }
    });

    this.parseParams = function(loc) {
      var qs,
          params = {},
          s = loc.search,
          h = loc.hash,
          hash = h.slice(1).split('&'),
          idx = s.lastIndexOf('/'),

          reValid = /[vaiobe]/, // v|a = video|audio id, i|b = IN, o|e = OUT
          reDigit = /^\d+$/; // 1 or more digit only, eg: 0, 1, 12

      // remove heading "?" and trailing "/"
      idx = idx > -1 ? idx : s.length;
      qs = s.slice(1, idx).split('&');

      // parse querystring and hash, hash overrides
      qs.concat(hash).forEach(function(entry) {
        var kv = entry.split('='),
            key = decodeURIComponent(kv[0]).charAt(0),
            val = decodeURIComponent(kv[1]).trim(),
            meta = this.attr.paramMetaMap[key];

        // skip invalid parameters
        if (!meta) {
          return;
        }

        params[meta] = val.split(this.attr[
          this.attr.rePos.test(key) ? 'parseGroup' : 'parseSeparator']);

      }.bind(this));

      // normalize video ids (index shortcut)
      params.videoId = (params.videoId || []).map(function(id, idx, array) {
        return reDigit.test(id) ? array[id] : id;
      });
      // normalize audio ids (index shortcut, starting from video ids)
      params.audioId = (params.audioId || []).map(function(id, idx, array) {
        return reDigit.test(id) ? params.videoId.concat(array)[id] : id;
      });

      return params;
    };

    this.parseClips = function(source, type, ids, array) {
      var index = 0,
          length = 0,
          bound = 0;

      if (type === 'out') {
        bound = Infinity;
      }

      (source || []).forEach(function eachInGroup(group, idx) {
        var id = ids[idx];

        if (!id) {
          return;
        }

        group.split(this.attr.parseSeparator).forEach(function eachItem(item) {
          var len, value,
              obj = array[index] || {id: id};

          // get value and occurences
          item = item.split(this.attr.parseMultiplier);
          len = (item[1] && this.fromBase64(item[1])) || 1;
          value = item[0];

          // set value base10 with bound fallback (0 or Infinity)
          value = value === '' ? bound : this.fromBase64(value);

          // set clip in/out and range from/to
          while (len--) {
            if (type === 'out') {
              obj.from = length;
              obj.to = length + (value - obj['in']);
            }
            length = obj.to + 1;
            obj[type] = value;
            array[index] = obj;
            index += 1;
          }

        }.bind(this));
      }.bind(this));
    };

    this.parseMetainfo = function() {
      var data = {
            video: [],
            audio: []
          },
          params = this.parseParams(window.location);

      // video clips
      this.parseClips(params.videoIn, 'in', params.videoId, data.video);
      this.parseClips(params.videoOut, 'out', params.videoId, data.video);

      // audio clips
      this.parseClips(params.audioIn, 'in', params.audioId, data.audio);
      this.parseClips(params.audioOut, 'out', params.audioId, data.audio);

      this.trigger('metainfoParsed', data);
    };
    
    this.after('initialize', function() {
      this.parseMetainfo();
    });

  }

  return component(meta, params);

});
