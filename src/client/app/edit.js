'use strict';

define([
  'data/search', 'ui/search', 'ui/track', 'data/timeline', 'ui/timeline'
], function(searchData, searchUI, trackUI, timelineData, timelineUI) {

  function initialize() {
    searchData.attachTo('#search');
    searchUI.attachTo('#search');
    trackUI.attachTo('#track');
    timelineData.attachTo('#timeline');
    timelineUI.attachTo('#timeline');
  }

  return initialize;

});
