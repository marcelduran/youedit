'use strict';

define(['flight/lib/component'], function(component) {

  function track() {
    var $node, $duration, $markin, $markout, $left, $right,
        video, rangeStyle;

    this.defaultAttrs({
      emptyClass: 'empty'
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

      $markin.text(min);
      $markout.text(max);
      $duration.val(max - min);
      $left.css('width', parseFloat(rangeStyle.left, 10) + '%');
      $right.css('width', (100 - (parseFloat(rangeStyle.left, 10) +
        parseFloat(rangeStyle.width, 10))) + '%');
    }

    function updateDuration() {
      var min = $node.slider('values', 0);
      $node.slider('values', 1, min + parseInt($duration.val(), 10));
    }

    function setSource(ev) {
      if ($(ev.target).hasClass('icon-audio')) {
        $node.addClass('audio');
      } else {
        $node.removeClass('audio');
      }
    }

    this.init = function() {
      $node = this.$node;
      $markin = $node.find('#mark-in');
      $markout = $node.find('#mark-out');
      $left = $node.find('.left-unused');
      $right = $node.find('.right-unused');

      $node.slider({
        range: true,
        min: 0,
        max: 1,
        values: [0, 1],
        slide: update,
        change: update,
        create: function() {
          var $range = $node.find('.ui-slider-range');

          rangeStyle = $range[0].style;
          $range.append('<input class="duration"><div class="baloon">' +
            '<i class="icon-video"></i><a class="video" href="#">' +
            'add video</a><a class="audio" href="#">add audio</a>' +
            '<i class="icon-audio"></i></div>');

          $duration = $range.find('.duration');
          $duration.on('change', updateDuration);

          $range.find('i').on('mouseover', setSource);

          update(null, {values: $node.slider('values')});
        }
      });
    };

    this.after('initialize', function() {
      this.init();
      this.on(document, 'videoSelected', this.setVideo);
    });

  }

  return component(track);

});
