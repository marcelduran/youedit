'use strict';

define(['flight/lib/component'], function(component) {

  function timeline() {

    this.video = {
      list: [],
      duration: 0,
      eventNames: {
        add: 'videoTrackAdded',
        update: 'videoTrackUpdated'
      },
      keys: {
        id: 'v',
        markIn: 'i',
        markOut: 'o'
      }
    };
    this.audio = {
      list: [],
      duration: 0,
      eventNames: {
        add: 'audioTrackAdded',
        update: 'audioTrackUpdated'
      },
      keys: {
        id: 'a',
        markIn: 'b',
        markOut: 'e'
      }
    };

    this.defaultAttrs({
    });

    this.addTrack = function(track, ev, data) {
      var trackData, duration, total;

      track.list.push(data),

      duration = data.to - data.from;
      track.duration += duration;
      total = Math.max(this.video.duration, this.audio.duration);

      trackData = {
        id: data.video.id,
        shard: data.video.shard,
        duration: duration,
        total: total,
        larger: track.duration === total &&
          this.audio.duration && this.video.duration
      };

      this.trigger(track.eventNames.add, trackData);
      this.update(track);
    };

    this.removeTrack = function(track, ev, data) {
      var removed, duration;

      removed = track.list.splice(data.index, 1)[0];
      duration = removed.to - removed.from;
      track.duration -= duration;

      this.update(track);
    };

    this.moveTrack = function(track, ev, data) {
      var index, item;

      index = data.index;
      item = track.list[index.previous];
      track.list[index.previous] = track.list[index.current]
      track.list[index.current] = item;

      this.update(track);
    };

    this.update = function(track) {
      this.trigger(track.eventNames.update, {
        list: track.list,
        keys: track.keys
      });
    }

    this.after('initialize', function() {
      this.on(document, 'videoTrackSelected',
        this.addTrack.bind(this, this.video));
      this.on(document, 'audioTrackSelected',
        this.addTrack.bind(this, this.audio));
      this.on(document, 'videoTrackRemoved',
        this.removeTrack.bind(this, this.video));
      this.on(document, 'audioTrackRemoved',
        this.removeTrack.bind(this, this.audio));
      this.on(document, 'videoTrackMoved',
        this.moveTrack.bind(this, this.video));
      this.on(document, 'audioTrackMoved',
        this.moveTrack.bind(this, this.audio));
    });

  }

  return component(timeline);

});
