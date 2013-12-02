'use strict';

define([

  'data/meta',
  'ui/player',
  'ui/comments',
  'ui/social'

], function(

  metaData,
  playerUI,
  commentsUI,
  socialUI

) {

  function initialize() {
    playerUI.attachTo('#video');
    metaData.attachTo(document);
    commentsUI.attachTo('#comments');
    socialUI.attachTo('#social');
  }

  return {
    initialize: initialize
  };

});
