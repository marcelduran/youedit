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
      queryUI.attachTo(this.attr.querySelector);
      resultsData.attachTo(document);
      resultsUI.attachTo(this.attr.resultsSelector);
    });

  }

  return component(search);
});
