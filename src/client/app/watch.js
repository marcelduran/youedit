'use strict';

define([

  'data/meta',
  'ui/player',

], function(

  metaData,
  playerUI

) {

  function initialize() {
    playerUI.attachTo('#player');
    metaData.attachTo(document);
  }

  return {
    initialize: initialize
  };

});
