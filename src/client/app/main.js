'use strict';

define([
  'src/client/app/data/search', 'src/client/app/ui/search',
  'src/client/app/ui/track'
], function(searchData, searchUI, trackUI) {

  function initialize() {
    searchData.attachTo('#search');
    searchUI.attachTo('#search');
    trackUI.attachTo('#track');
  }

  return initialize;

});

require(['src/client/app/main'], function(initialize) {
  initialize();
});
