'use strict';

define([
  'flight/lib/component', 'mixins/time', 'mixins/template', 'jqueryui/sortable'
], function(component, time, template) {

  function timeline() {
    var video, audio, $timemarks;
    var tmpl = '<li style="background-image:url(//i{{shard}}.ytimg.com/vi/{{id}}/default.jpg)"><span>{{duration}}</span></li>';

    this.defaultAttrs({
      filmstripSelector: '.filmstrip ul',
      framesSelector: '.filmstrip ul li',
      highlightClass: 'ui-state-highlight',
      videoTrackSelector: '#video-track',
      audioTrackSelector: '#audio-track',
      videoStripSelector: '#video-track ul',
      audioStripSelector: '#audio-track ul',
      timemarksSelector: '.timemarks'
    });

    this.init = function() {
      video = {
        $node: this.$node.find(this.attr.videoTrackSelector),
        $list: this.$node.find(this.attr.videoStripSelector)
      };
      audio = {
        $node: this.$node.find(this.attr.audioTrackSelector),
        $list: this.$node.find(this.attr.audioStripSelector)
      };
      $timemarks = this.$node.find(this.attr.timemarksSelector);

      this.$node.find(this.attr.filmstripSelector).sortable({
        placeholder: this.attr.highlightClass,
        axis: 'x'
      }).disableSelection();
    };

    this.timemarks = function(duration) {
      var marksTmpl = '<li style="left:{{pos}}%">{{time}}</li>';
      var marksLength = 11;
      var i, el, perc, pos, time, max, factor,
          existingMarks = $timemarks.find('li'),
          existingCount = existingMarks.length;

      // fine tuning
      factor = Math.min(marksLength,
          parseInt(duration / marksLength, 10) || 1, 5);
      max = Math.max(Math.round(duration / factor) * factor, duration);
      if (duration < marksLength) {
        marksLength = duration + 1;
      } else {
        max = Math.ceil(max / 5) * 5;
      }

      for (i = 0; i < marksLength; i++) {
        perc = i / (marksLength - 1);
        pos = perc * 100;
        time = this.prettyTime(
          perc === 1 ? max : Math.round(max * perc / factor) * factor);

        if (i < existingCount) {
          $(existingMarks[i]).text(time).css('left', pos + '%');
        } else {
          $timemarks.append(this.template(marksTmpl, {pos: pos, time: time}));
        }
      }
    };

    this.update = function(frames, total) {
      frames.css('width', function() {
        return ($(this).data('duration') / total * 100) + '%';
      });
      this.timemarks(total);
    };

    this.addTrack = function(track, ev, data) {
      var view, frames;

      view = {
        id: data.id,
        shard: data.shard,
        duration: this.prettyTime(data.duration)
      };

      $(this.template(tmpl, view))
        .data('duration', data.duration)
        .appendTo(track.$list);

      // update both filmstrips?
      frames = data.larger ?
        this.$node.find(this.attr.framesSelector) : track.$list.find('li');

      this.update(frames, data.total);
      track.$node.removeClass('empty');
    };

    this.after('initialize', function() {
      this.init();
      this.on('videoTrackAdded', this.addTrack.bind(this, video));
      this.on('audioTrackAdded', this.addTrack.bind(this, audio));
    });

  }

  return component(timeline, time, template);

});
