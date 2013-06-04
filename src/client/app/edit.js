'use strict';

define([
  'data/search', 'ui/search', 'ui/track'
], function(searchData, searchUI, trackUI) {

  function initialize() {
    searchData.attachTo('#search');
    searchUI.attachTo('#search');
    trackUI.attachTo('#track');
  }

  return initialize;

});
