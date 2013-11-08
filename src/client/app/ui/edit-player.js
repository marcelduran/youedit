'use strict';

define([
  'flight/lib/component',
  'swfobject/swfobject'
], function(component, swfobject) {

  function player() {

    this.defaultAttrs({
      playerURL: 'http://www.youtube.com/apiplayer?' +
        'version=3&enablejsapi=1',
      playerWidth: 530,
      playerHeight: 322,
      flashVersion: 10,
      playerParams: {allowScriptAccess: 'always'},

      playerClass: 'player',
      playerSelector: '.player',

      hasPlayerClass: 'has-player'
    });

    this.createGlobalEvents = function() {
      window.onYouTubePlayerReady = function() {
        this.player = this.select('playerSelector')[0];
        this.player.addEventListener('onError', 'onPlayerError');
      }.bind(this);

      window.onPlayerError = function(errorCode) {
        console.log('An error occured of type %s', errorCode);
      };
    };

    this.createPlayersMarkup = function() {
      var markup = '<div class="' + this.attr.playerClass + '"/>';
      this.$node.prepend(markup);
    };

    this.setVideo = function(ev, data) {
      this.player.loadVideoById(data.video.id);
      this.$node.addClass(this.attr.hasPlayerClass);
    };

    this.embedPlayer = function() {
      var playerAttrs = {
        'class': this.attr.playerClass
      };

      swfobject.embedSWF(this.attr.playerURL, this.select('playerSelector')[0],
        this.attr.playerWidth, this.attr.playerHeight, this.attr.flashVersion,
        null, null, this.attr.playerParams, playerAttrs);
    };

    this.setPosition = function(ev, data) {
      this.player.seekTo(data.value, true);
    };

    this.after('initialize', function() {
      this.createPlayersMarkup();
      this.createGlobalEvents();
      this.embedPlayer();
      this.on(document, 'videoSelected', this.setVideo);
      this.on(document, 'trackPositionChanged', this.setPosition);
    });
  }

  return component(player);

});
