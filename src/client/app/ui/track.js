'use strict';

define(['flight/lib/component', 'mixins/time', 'jqueryui/slider'], function(component, time) {

  function track() {
    var $node, $duration, $markin, $markout, $left, $right,
        video, rangeStyle, slider, mouseCapture, sourceTimeout;

    this.defaultAttrs({
      emptyClass: 'empty',
      audioClass: 'audio',
      audioLinkSelector: 'a.audio'
    });

    this.setVideo = function(ev, data) {
      video = data.video;
      $node.css('background-image', 'url(http://i' + video.shard +
        '.ytimg.com/vi/' + video.id + '/default.jpg)');
      $node.slider('option', 'max', video.duration);
      $node.slider('option', 'values', [0, video.duration]);
      $('body').removeClass(this.attr.emptyClass);
    };

    function update(ev, ui) {
      var values = ui.values,
          min = values[0],
          max = values[1];

      $markin.text(this.prettyTime(min));
      $markout.text(this.prettyTime(max));
      $duration.val(this.prettyTime(max - min));
      $left.css('width', parseFloat(rangeStyle.left, 10) + '%');
      $right.css('width', (100 - (parseFloat(rangeStyle.left, 10) +
        parseFloat(rangeStyle.width, 10))) + '%');
    }

    function updateDuration() {
      var min = $node.slider('values', 0),
          value = this.timeToSec($duration.val());

      $node.slider('values', 1, min + value);
    }

    function setSource(ev) {
      sourceTimeout = setTimeout(function(ev) {
        if ($(ev.target).parents().addBack().is(this.attr.audioLinkSelector)) {
          $node.addClass(this.attr.audioClass);
        } else {
          $node.removeClass(this.attr.audioClass);
        }
      }.bind(this, ev), 300);
    }

    function addTrack(ev) {
      var values = $node.slider('values');
        track = {
          from: values[0],
          to: values[1],
          video: video
        };

      ev.preventDefault();

      if ($(ev.target).parents().addBack().is(this.attr.audioLinkSelector)) {
        this.trigger('audioTrackSelected', track);
      } else {
        this.trigger('videoTrackSelected', track);
      }
    }

    function unsetSourceTimeout() {
      clearTimeout(sourceTimeout);
    }

    function sliderCreated() {
      var $range = $node.find('.ui-slider-range');

      rangeStyle = $range[0].style;
      $range.append('<input class="duration"><div class="baloon">' +
        '<div class="actions">' +
        '<a class="video" href="#"><i class="icon-video"></i>' +
        'add video</a><a class="audio" href="#">add audio' +
        '<i class="icon-audio"></i></a></div></div>');

      $duration = $range.find('.duration');
      $duration.on('change', updateDuration.bind(this));

      $range.find('a')
        .on('mouseover', setSource.bind(this))
        .on('mouseout', unsetSourceTimeout)
        .on('click', addTrack.bind(this));
    }

    // prevent baloon click to move handlers
    function preCapture(ev) {
      if (!$(ev.target).parents().addBack().is('.baloon')) {
        return mouseCapture.call(this, ev);
      }
    }

    this.initializeSlider = function() {
      $node = this.$node;
      $markin = $node.find('#mark-in');
      $markout = $node.find('#mark-out');
      $left = $node.find('.left-unused');
      $right = $node.find('.right-unused');

      slider = $node.slider({
        range: true,
        min: 0,
        max: 1,
        values: [0, 1],
        slide: update.bind(this),
        change: update.bind(this),
        create: sliderCreated.bind(this)
      }).data('ui-slider');

      // hijack slide handlers click
      mouseCapture = slider._mouseCapture;
      slider._mouseCapture = preCapture;
    };

    this.after('initialize', function() {
      this.initializeSlider();
      this.on(document, 'videoSelected', this.setVideo);
    });

  }

  return component(track, time);

});
