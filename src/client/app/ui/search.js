'use strict';

define([
  'flight/lib/component',
  'ui/query',
  'data/results',
  'ui/results'
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
