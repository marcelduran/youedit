'use strict';

define([
  'flight/lib/component', 'mixins/time', 'jqueryui/sortable'
], function(component, time) {

  function timeline() {

    this.defaultAttrs({
      filmstripSelector: '.filmstrip ul',
      highlightClass: 'ui-state-highlight',
      videoTrackSelector: '#video-track',
      audioTrackSelector: '#audio-track',
      videoStripSelector: '#video-track ul',
      audioStripSelector: '#audio-track ul'
    });

    this.init= function() {
      this.$node.find(this.attr.filmtripSelector).sortable({
        placeholder: this.attr.highlightClass,
        axis: 'x'
      }).disableSelection();
    };

    this.addTrack = function(ev, data) {
      if (ev.type === 'videoTrackAdded') {
        this.$node.find(this.attr.videoStripSelector).append(
          '<li style="background-image:url(//i' + data.video.shard + '.ytimg.com/vi/' + data.video.id + '/default.jpg)"><span>' + (data.to - data.from) + '</span></li>'
        );
        this.$node.find(this.attr.videoTrackSelector).removeClass('empty');
      } else {
      }
    };

    this.after('initialize', function() {
      this.init();
      this.on('videoTrackAdded', this.addTrack);
      this.on('audioTrackAdded', this.addTrack);
    });

  }

  return component(timeline, time);

});
