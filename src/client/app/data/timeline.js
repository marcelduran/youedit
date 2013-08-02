'use strict';

define(['flight/lib/component'], function(component) {

  function timeline() {
    var video, audio;

    video = {
      list: [],
      duration: 0,
      addEventName: 'videoTrackAdded'
    };
    audio = {
      list: [],
      duration: 0,
      addEventName: 'audioTrackAdded'
    };

    this.defaultAttrs({
    });

    this.addTrack = function(track, ev, data) {
      var trackData, duration, total;

      track.list.push(data),

      duration = data.to - data.from;
      track.duration += duration;
      total = Math.max(video.duration, audio.duration);

      trackData = {
        id: data.video.id,
        shard: data.video.shard,
        duration: duration,
        total: total,
        larger: track.duration === total && audio.duration && video.duration
      };

      this.trigger(track.addEventName, trackData);
    };

    this.after('initialize', function() {
      this.on(document, 'videoTrackSelected', this.addTrack.bind(this, video));
      this.on(document, 'audioTrackSelected', this.addTrack.bind(this, audio));
    });

  }

  return component(timeline);

});
