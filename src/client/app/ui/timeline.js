'use strict';

define([
  'flight/lib/component', 'mixins/time', 'mixins/template', 'jqueryui/sortable'
], function(component, time, template) {

  function timeline() {
    var video, audio, winWidth, $container,
        contSize = 1;
    var tmpl = '<li style="background-image:url(//i{{shard}}.ytimg.com/vi/{{id}}/default.jpg)"><span>{{duration}}</span><a class="remove icon-close" href="#remove"></a></li>';

    this.defaultAttrs({
      filmstripSelector: '.filmstrip ul',
      framesSelector: '.filmstrip ul li',
      trackSelector: '.filmstrip',
      videoTrackSelector: '#video-track',
      audioTrackSelector: '#audio-track',
      videoStripSelector: '#video-track ul',
      audioStripSelector: '#audio-track ul',
      timemarksSelector: '.timemarks',
      containerSelector: '.container',
      removeSelector: '.remove',

      highlightClass: 'ui-state-highlight',
      emptyClass: 'empty',
      hiddenClass: 'hidden',

      marksPerPage: 11
    });

    this.total = 0;
    this.eventMap = {
      'video-track': {
        'removed': 'videoTrackRemoved',
        'moved': 'videoTrackMoved'
      },
      'audio-track': {
        'removed': 'audioTrackRemoved',
        'moved': 'audioTrackMoved'
      }
    };

    this.init = function() {
      video = {
        $node: this.$node.find(this.attr.videoTrackSelector),
        $list: this.$node.find(this.attr.videoStripSelector)
      };
      audio = {
        $node: this.$node.find(this.attr.audioTrackSelector),
        $list: this.$node.find(this.attr.audioStripSelector)
      };
      this.$timemarks = this.$node.find(this.attr.timemarksSelector);
      $container = this.$node.find(this.attr.containerSelector);

      this.$node.find(this.attr.filmstripSelector).sortable({
        placeholder: this.attr.highlightClass,
        axis: 'x',
        start: this.moveFrameStart.bind(this),
        stop: this.moveFrameStop.bind(this)
      }).disableSelection();

      winWidth = $(window).width();
    };

    this.moveFrameStart = function(ev, ui) {
      this.movingFrameIndex = ui.item.index();
    };

    this.moveFrameStop = function(ev, ui) {
      var index, eventName,
          $frame, $trackNode;

      $frame = ui.item;
      index = $frame.index();

      if (index === this.movingFrameIndex) {
        return;
      }

      $trackNode = $frame.parents(this.attr.trackSelector);
      eventName = this.eventMap[$trackNode.attr('id')].moved;
      this.trigger(eventName, {
        index: {
          previous: this.movingFrameIndex,
          current: index
        }
      });
    };

    this.setTimemarks = function(duration) {
      var marksTmpl = '<li style="left:{{pos}}%">{{time}}</li>';
      var i, perc, pos, time, max, factor,
          marksLength, marksBound, existingMarks, existingBound;

      marksLength = this.attr.marksPerPage * contSize;
      marksBound = marksLength - 1;
      existingMarks = this.$timemarks.find('li');
      existingBound = existingMarks.length - 1;

      if (duration <= 0) {
        this.$timemarks.addClass(this.attr.emptyClass);
      } else {
        this.$timemarks.removeClass(this.attr.emptyClass);
      }

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
        perc = i / marksBound;
        pos = perc * 100;
        time = this.prettyTime(
          perc === 1 ? max : Math.round(max * perc / factor) * factor);

        if (i <= existingBound) {
          // reuse existing nodes, forcing last to be used
          $(existingMarks[i === marksBound ? existingBound : i])
            .text(time)
            .css('left', pos + '%')
            .removeClass(this.attr.hiddenClass);
        } else {
          // create new nodes
          this.$timemarks.append(
            this.template(marksTmpl, {pos: pos, time: time}));
        }
      }

      // hide unused nodes, but last one
      i = marksBound;
      while (i < existingBound) {
        $(existingMarks[i++]).addClass(this.attr.hiddenClass);
      }
    };

    this.update = function(frames, $trackNode) {
      var i, len, perc, minWidth, $frame,
          minPerc = Infinity;

      // set all frames new width
      for (i = 0, len = frames.length; i < len; i++) {
        $frame = $(frames[i]);
        perc = $frame.data('duration') / this.total;

        if (perc < minPerc) {
          minPerc = perc;
        }

        $frame.width((perc * 100) + '%');
      }

      // adjust container scroll size
      minWidth = minPerc * winWidth * contSize;
      if (minWidth < 60) {
        contSize = Math.ceil((60 / minPerc) / winWidth);
      } else {
        contSize = 1;
      }
      $container.width((contSize * 100) + '%');

      this.setTimemarks(this.total, contSize);

      if (len > 0) {
        $trackNode.removeClass(this.attr.emptyClass);
      } else {
        $trackNode.addClass(this.attr.emptyClass);
      }
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

      this.total = data.total;

      this.update(frames, track.$node);
    };

    this.removeTrack = function(ev) {
      var $frame, $trackNode, frames, eventName, index;

      ev.preventDefault();

      $frame = $(ev.target).parents('li');
      $trackNode = $frame.parents(this.attr.trackSelector);

      this.total -= $frame.data('duration');

      index = $frame.index();
      $frame.remove();

      eventName = this.eventMap[$trackNode.attr('id')].removed;
      this.trigger(eventName, {index: index});

      frames = this.$node.find(this.attr.framesSelector);
      this.update(frames, $trackNode);
    };

    this.after('initialize', function() {
      this.init();
      this.on('videoTrackAdded', this.addTrack.bind(this, video));
      this.on('audioTrackAdded', this.addTrack.bind(this, audio));
      this.$node.on('click', this.attr.removeSelector,
        this.removeTrack.bind(this));
    });

  }

  return component(timeline, time, template);

});
