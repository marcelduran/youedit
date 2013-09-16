'use strict';

define([
  'flight/lib/component', 'mixins/time', 'mixins/template', 'jqueryui/sortable'
], function(component, time, template) {

  function timeline() {
    var video, audio, winWidth, $timemarks, $container,
        contSize = 1;
    var tmpl = '<li style="background-image:url(//i{{shard}}.ytimg.com/vi/{{id}}/default.jpg)"><span>{{duration}}</span><a class="remove icon-close" href="#remove"></a></li>';

    this.defaultAttrs({
      filmstripSelector: '.filmstrip ul',
      framesSelector: '.filmstrip ul li',
      videoTrackSelector: '#video-track',
      audioTrackSelector: '#audio-track',
      videoStripSelector: '#video-track ul',
      audioStripSelector: '#audio-track ul',
      timemarksSelector: '.timemarks',
      containerSelector: '.container',
      highlightClass: 'ui-state-highlight',
      emptyClass: 'empty',
      toolsClass: 'tools'
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
      $container = this.$node.find(this.attr.containerSelector);

      this.$node.find(this.attr.filmstripSelector).sortable({
        placeholder: this.attr.highlightClass,
        axis: 'x'
      }).disableSelection();

      winWidth = $(window).width();
    };

    this.timemarks = function(duration, multiplier) {
      var marksTmpl = '<li style="left:{{pos}}%">{{time}}</li>';
      var marksLength = 11 * multiplier;
      var i, perc, pos, time, max, factor,
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
      var i, len, perc, minWidth, $frame,
          minPerc = Infinity;

      // set all frames new width
      for (i = 0, len = frames.length; i < len; i++) {
        $frame = $(frames[i]);
        perc = $frame.data('duration') / total;

        if (perc < minPerc) {
          minPerc = perc;
        }

        $frame.width((perc * 100) + '%');
      }

      // adjust container scroll size
      minWidth = minPerc * winWidth * contSize;
      if (minWidth < 60) {
        contSize = Math.ceil((60 / minPerc) / winWidth);
        $container.width((contSize * 100) + '%');
      }

      this.timemarks(total, contSize);
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
      track.$node.removeClass(this.attr.emptyClass);
    };

    this.showTools = function(ev) {
      $(ev.target).addClass(this.attr.toolsClass);
    };

    this.hideTools = function(ev) {
      var $target = $(ev.target);

      //if ($target.parents(this.attr.framesSelector)) {
      //  return;
      //}
      console.log($target, ev);
      $target.removeClass(this.attr.toolsClass);
    };

    this.after('initialize', function() {
      this.init();
      this.on('videoTrackAdded', this.addTrack.bind(this, video));
      this.on('audioTrackAdded', this.addTrack.bind(this, audio));
      this.$node.on('mouseover', this.attr.framesSelector,
        this.showTools.bind(this));
      this.$node.on('mouseout', this.attr.framesSelector,
        this.hideTools.bind(this));
    });

  }

  return component(timeline, time, template);

});
