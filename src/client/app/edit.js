'use strict';

define([

  'data/search',
  'ui/search',
  'ui/track',
  'data/timeline',
  'ui/timeline',
  'data/location'

], function(

  searchData,
  searchUI,
  trackUI,
  timelineData,
  timelineUI,
  locationData

) {

  function initialize() {
    searchData.attachTo('#search');
    searchUI.attachTo('#search');
    trackUI.attachTo('#track');
    timelineData.attachTo('#timeline');
    timelineUI.attachTo('#timeline');
    locationData.attachTo(document); 
  }

  return initialize;

});
