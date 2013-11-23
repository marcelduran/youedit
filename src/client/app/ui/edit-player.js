'use strict';

define(['flight/lib/component'], function(component) {

  function player() {

    this.defaultAttrs({
      playerURL: '//www.youtube.com/iframe_api',
      playerWidth: 530,
      playerHeight: 322,
      playerVars: {
        autoplay: 0,        // no autoplay
        controls: 1,        // show all playback controls
        modestbranding: 1,  // no YT logo
        rel: 0,             // no related videos at the end
        showinfo: 0,        // no video info
        fs: 0               // no fullscreen button
      },

      playerClass: 'player',
      playerSelector: '.player',

      hasPlayerClass: 'has-player'
    });

    this.setVideo = function(ev, data) {
      if (this.player && this.player.cueVideoById) {
        this.player.cueVideoById(data.video.id);
        this.player.seekTo(0, true);
        this.player.pauseVideo();
      } else if (this.player && this.player.ready) {
        this.player = new YT.Player(this.select('playerSelector')[0], {
          videoId: data.video.id,
          width: this.attr.playerWidth,
          height: this.attr.playerHeight,
          playerVars: this.attr.playerVars,
          events: {
            onStateChange: this.onStateChange.bind(this)
          }
        });
      } else {
        // yt player not loaded yet, try again
        setTimeout(this.setVideo.bind(this, ev, data), 250);
      }
      this.$node.addClass(this.attr.hasPlayerClass);
    };

    this.onStateChange = function(ev) {
      if (ev.data === YT.PlayerState.PAUSED &&
          this.lastPlayerState !== YT.PlayerState.PLAYING) {
        this.trigger('videoPositionChanged', {
          value: Math.round(ev.target.getCurrentTime())
        });
      }
      this.lastPlayerState = ev.data;
    };

    this.setPosition = function(ev, data) {
      if (this.player && this.player.seekTo) {
        this.player.seekTo(data.value, true);
        this.player.pauseVideo();
      }
    };

    this.init = function() {
      var markup = '<div class="' + this.attr.playerClass + ' edit"/>';

      this.$node.prepend(markup);

      $.getScript(this.attr.playerURL);

      window.onYouTubeIframeAPIReady = function() {
        this.player = {ready: true};
      }.bind(this);
    };

    this.after('initialize', function() {
      this.init();
      this.on(document, 'videoSelected', this.setVideo);
      this.on(document, 'trackPositionChanged', this.setPosition);
    });
  }

  return component(player);

});
