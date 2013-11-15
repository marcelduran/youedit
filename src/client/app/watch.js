'use strict';

define([

  'data/meta',
  'ui/player',
  'ui/comments'

], function(

  metaData,
  playerUI,
  commentsUI

) {

  function initialize() {
    playerUI.attachTo('#video');
    metaData.attachTo(document);
    commentsUI.attachTo('#comments');
  }

  return {
    initialize: initialize
  };

});
