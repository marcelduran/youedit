'use strict';

define(['flight/lib/component'], function(component) {

  function timeline() {
    var videos = [],
        audios = [];

    this.defaultAttrs({
    });

    this.addTrack = function(ev, data) {
      var container, eventName;

      if (ev.type === 'videoTrackSelected') {
        container = videos;
        eventName = 'videoTrackAdded';
      } else {
        container = audios;
        eventName = 'audioTrackAdded';
      }
      data.count = container.push(data);
      this.trigger(eventName, data);
    };

    this.after('initialize', function() {
      this.on(document, 'videoTrackSelected', this.addTrack);
      this.on(document, 'audioTrackSelected', this.addTrack);
    });

  }

  return component(timeline);

});
