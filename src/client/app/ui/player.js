'use strict';

define([
  'flight/lib/component',
  'swfobject/swfobject'
], function(component, swfobject) {

  function player() {

    this.defaultAttrs({
      playerURL: 'http://www.youtube.com/apiplayer?' +
                 'version=3&enablejsapi=1&playerapiid=player',
      playerWidth: 640,
      playerHeight: 390,
      flashVersion: 10,
      objParams: {allowScriptAccess: 'always'},
      bufferLength: 3,

      playerClass: 'player',
      playerSelector: '.player'
    });

    this.createPlayers = function() {
      var i, markup = '';
      for (i = 0; i < this.attr.bufferLength; i++) {
        markup += '<div class="player" id="player-' + i + '"/>';
      }
      this.$node.prepend(markup);
      this.$players = this.select('playerSelector');
    };

    this.start = function(ev, data) {
      console.log(data);
      var objAttrs = {
        'id': this.$players[0].id,
        'class': this.attr.playerClass
      };
      swfobject.embedSWF(this.attr.playerURL, this.$players[0],
        this.attr.playerWidth, this.attr.playerHeight, this.attr.flashVersion,
        null, null, this.attr.ObjParams, objAttrs);
    };

    this.after('initialize', function() {
      this.createPlayers();
      this.on(document, 'metainfoParsed', this.start);
    });
  }

  return component(player);

});

