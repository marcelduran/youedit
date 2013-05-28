'use strict';

define([
  'src/client/app/data/search', 'src/client/app/ui/search'
], function(searchData, searchUI) {

  function initialize() {
    searchData.attachTo('#search');
    searchUI.attachTo('#search');
  }

  return initialize;

});

require(['src/client/app/main'], function(initialize) {
  initialize();
});
