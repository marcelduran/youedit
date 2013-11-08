'use strict';

define([

  'data/search',
  'ui/search',
  'ui/track',
  'data/timeline',
  'ui/timeline',
  'data/location',
  'ui/title',
  'ui/edit-player'

], function(

  searchData,
  searchUI,
  trackUI,
  timelineData,
  timelineUI,
  locationData,
  titleUI,
  playerUI

) {

  function initialize() {
    searchData.attachTo('#search');
    searchUI.attachTo('#search');
    trackUI.attachTo('#track');
    timelineData.attachTo('#timeline');
    timelineUI.attachTo('#timeline');
    locationData.attachTo(document); 
    titleUI.attachTo('#mix-title'); 
    playerUI.attachTo('#video');
  }

  return initialize;

});
