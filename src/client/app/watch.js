'use strict';

define([

  'data/meta',
  'ui/player',

], function(

  metaData,
  playerUI

) {

  function initialize() {
    playerUI.attachTo('#video');
    metaData.attachTo(document);
  }

  return {
    initialize: initialize
  };

});
