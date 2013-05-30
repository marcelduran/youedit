'use strict';

define([
  'components/flight/lib/component',
  'src/client/app/ui/query',
  'src/client/app/data/results',
  'src/client/app/ui/results'
], function(component, queryUI, resultsData, resultsUI) {

  function search() {

    this.defaultAttrs({
      querySelector: '#query',
      resultsSelector: '#results'
    });

    this.after('initialize', function() {
      resultsData.attachTo(document);
      resultsUI.attachTo(this.attr.resultsSelector);
      queryUI.attachTo(this.attr.querySelector);
    });

  }

  return component(search);
});
