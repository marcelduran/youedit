'use strict';

define([
  'flight/lib/component',
  'swfobject/swfobject'
], function(component, swfobject) {

  function player() {

    this.defaultAttrs({
      playerURL: 'http://www.youtube.com/apiplayer?' +
                 'version=3&enablejsapi=1&playerapiid=',
      playerWidth: 640,
      playerHeight: 390,
      flashVersion: 10,
      playerParams: {allowScriptAccess: 'always'},

      videoBufferLength: 3,

      activeClass: 'active',
      playerClass: 'player',
      playerSelector: '.player'
    });

    this.createGlobalEvents = function() {
      window.onYouTubePlayerReady = function(playerId) {
        var player, type, index, mgr, $player;

        type = playerId.slice(0, 5);
        index = parseInt(playerId.slice(5), 10);
        mgr = this.managers[type];

        $player = mgr.$players[index] = $('#' + type + '-player-' + index);
        player = mgr.players[index] = $player[0];
        player.addEventListener('onStateChange',
          'onPlayerStateChange_' + type + index);
        player.addEventListener('onError', 'onPlayerError');

        if (index === 0) {
          $player.addClass(this.attr.activeClass);
        }

        this.cue(player, index, mgr);
      }.bind(this);

      window.onPlayerError = function(errorCode) {
        console.log('An error occured of type %s', errorCode);
      };
    };

    /* -1 (unstarted)
        0 (ended)
        1 (playing)
        2 (paused)
        3 (buffering)
        5 (video cued) */
    this.onPlayerStateChange = function(mgr, index, state) {
      var player, duration;

      player = mgr.players[index];
      duration = player.getDuration();

      // unmute paused video/audio
      if (state === 2 && duration && player.isMuted()) {
        player.unMute();
      }

      if (state === 0) {
        mgr.ids[mgr.curPlayer] = null;
        mgr.$players[mgr.curPlayer].toggleClass(this.attr.activeClass);
        mgr.curPlayer = (mgr.curPlayer + 1) % mgr.bufferLength;
        if (mgr.ids[mgr.curPlayer]) {
          player = mgr.players[mgr.curPlayer];
          mgr.$players[mgr.curPlayer].toggleClass(this.attr.activeClass);
          player.unMute();
          player.playVideo();
        }
        if (mgr.curPlayer !== mgr.curBuffer) {
          this.next(mgr);
        }
      }
    };

    this.createPlayersMarkup = function() {
      var markup = '';

      ['video'].forEach(function(type) {
        var i = this.attr[type + 'BufferLength'];

        while (i--) {
          markup += '<div class="player" id="' + type + '-player-' + i + '"/>';
        }
      }.bind(this));

      this.$node.prepend(markup);
    };

    this.loadPlayer = function(mgr) {
      var id, index, player, playerEl, playerAttrs;
      
      id = mgr.list[mgr.current].id;
      index = mgr.curBuffer;
      player = mgr.players[index];
      playerEl = $('#' + mgr.type + '-player-' + index)[0];
      playerAttrs = {
        'id': playerEl.id,
        'class': this.attr.playerClass
      };

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
        swfobject.embedSWF(this.attr.playerURL + mgr.type + index, playerEl,
          this.attr.playerWidth, this.attr.playerHeight, this.attr.flashVersion,
          null, null, this.attr.playerParams, playerAttrs);
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
        player.unMute();
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

    this.start = function(ev, data) {
      // video/audio managers config object
      this.managers = {
        video: {
          type: 'video',
          current: 0,
          list: data.video,
          curBuffer: 0,
          curPlayer: 0,
          bufferLength: this.attr.videoBufferLength,
          ids: [],
          players: [],
          $players: [],
          playingIndex: []
        }
      };

      // create player listeners
      Object.keys(this.managers).forEach(function(type) {
        var mgr = this.managers[type],
            i = mgr.bufferLength;

        while(i--) {
          window['onPlayerStateChange_' + type + i] =
            this.onPlayerStateChange.bind(this, mgr, i);
        }
      }.bind(this));

      this.next(this.managers.video);
    };

    this.after('initialize', function() {
      this.createPlayersMarkup();
      this.createGlobalEvents();
      this.on(document, 'metainfoParsed', this.start);
    });
  }

  return component(player);

});
