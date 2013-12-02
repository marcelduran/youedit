'use strict';

define([
  'flight/lib/component',
  'mixins/template'
], function(component, template) {

  function player() {

    this.defaultAttrs({
      playerURL: '//www.youtube.com/iframe_api',
      playerWidth: 640,
      playerHeight: 390,
      playerVars: {
        autoplay: 0,        // no autoplay
        controls: 0,        // no playback controls
        modestbranding: 1,  // no YT logo
        rel: 0,             // no related videos at the end
        showinfo: 0,        // no video info
        fs: 0               // no fullscreen button
      },

      bufferLength: {
        video: 3,
        audio: 2
      },

      activeClass: 'active',
      playerSelector: '.player',
      playerMarkup:
        '<div class="player {{type}}" id="{{type}}-player-{{index}}"/>'
    });

    this.init = function() {
      var markup = '';

      $.ajax({
        url: this.attr.playerURL,
        dataType: 'script',
        cache: true
      });

      ['video', 'audio'].forEach(function(type) {
        var i = this.attr.bufferLength[type];

        while (i--) {
          markup += this.template(this.attr.playerMarkup, {
            type: type,
            index: i
          });
        }
      }.bind(this));
      this.$node.prepend(markup);

      window.onYouTubeIframeAPIReady = this.start.bind(this);
    };

    this.onPlayerReady = function(mgr, index, ev) {
      var player, $player;

      $player = mgr.$players[index] = $('#' + mgr.type + '-player-' + index);
      player = mgr.players[index] = ev.target;

      if (mgr.hasAudio) {
        player.mute();
      }

      if (index === 0) {
        $player.addClass(this.attr.activeClass);
      }

      this.cue(player, index, mgr);
    };

    this.onPlayerStateChange = function(mgr, ev) {
      var player, duration;

      // playback start event, only once
      if (!this.playbackStarted && ev.data === YT.PlayerState.PLAYING) {
        this.playbackStarted = true;
        this.trigger('playbackStarted');
      }

      player = ev.target;
      duration = player.getDuration();

      // unmute paused video/audio (for videos, only audioless tracks)
      if (ev.data === YT.PlayerState.PAUSED && duration &&
          player.isMuted() && !mgr.hasAudio) {
        player.unMute();
      }

      if (ev.data === YT.PlayerState.ENDED) {
        mgr.ids[mgr.curPlayer] = null;
        mgr.$players[mgr.curPlayer].toggleClass(this.attr.activeClass);
        mgr.curPlayer = (mgr.curPlayer + 1) % mgr.bufferLength;
        if (mgr.ids[mgr.curPlayer]) {
          player = mgr.players[mgr.curPlayer];
          mgr.$players[mgr.curPlayer].toggleClass(this.attr.activeClass);
          if (!mgr.hasAudio) {
            player.unMute();
          }
          player.playVideo();
        }
        if (mgr.curPlayer !== mgr.curBuffer) {
          this.next(mgr);
        }
      }
    };

    this.loadPlayer = function(mgr) {
      var id, index, player, playerEl;
      
      id = mgr.list[mgr.current].id;
      index = mgr.curBuffer;
      player = mgr.players[index];
      playerEl = $('#' + mgr.type + '-player-' + index)[0];

      // no player buffer available
      if (mgr.ids[index]) {
        return false;
      }

      mgr.ids[index] = id;
      mgr.playingIndex[index] = mgr.current;
      mgr.curBuffer = (mgr.curBuffer + 1) % mgr.bufferLength;

      if (player) {
        // cue video/audio
        this.cue(player, index, mgr);
      } else {
        // embed new player
        this.player = new YT.Player(playerEl, {
          videoId: id,
          width: this.attr.playerWidth,
          height: this.attr.playerHeight,
          playerVars: this.attr.playerVars,
          events: {
            onStateChange: this.onPlayerStateChange.bind(this, mgr),
            onReady: this.onPlayerReady.bind(this, mgr, index)
          }
        });
      }

      return mgr.curBuffer !== mgr.curPlayer;
    };

    this.cue = function(player, index, mgr) {
      var track = mgr.list[mgr.playingIndex[index]];

      player.cueVideoById({
        videoId: mgr.ids[index],
        startSeconds: track.in,
        endSeconds: track.out
      });
      player.mute();
      player.seekTo(track.in, true);

      if (index === mgr.curPlayer) {
        if (!mgr.hasAudio) {
          player.unMute();
        }
        player.playVideo();
      } else {
        player.pauseVideo();
      }
    };

    this.next = function(mgr) {
      var hasBuffer;

      if (mgr.current < mgr.list.length) {
        hasBuffer = this.loadPlayer(mgr);
        mgr.current++;
        if (hasBuffer) {
          this.next(mgr);
        }
      }
    };

    this.setData = function(ev, data) {
      // video/audio managers config object
      this.managers = {
        video: {
          type: 'video',
          current: 0,
          list: data.video,
          curBuffer: 0,
          curPlayer: 0,
          bufferLength: this.attr.bufferLength.video,
          ids: [],
          players: [],
          $players: [],
          playingIndex: [],
          hasAudio: data.audio.length > 0
        },
        audio: {
          type: 'audio',
          current: 0,
          list: data.audio,
          curBuffer: 0,
          curPlayer: 0,
          bufferLength: this.attr.bufferLength.audio,
          ids: [],
          players: [],
          $players: [],
          playingIndex: []
        }
      };
    };

    this.start = function() {
      this.next(this.managers.video);
      this.next(this.managers.audio);
    };

    this.after('initialize', function() {
      this.init();
      this.on(document, 'metainfoParsed', this.setData);
      this.on(document, 'startPreview', this.start);
    });
  }

  return component(player, template);

});
