'use strict';

define(['flight/lib/component'], function(component) {

  function results() {

    this.after('initialize', function() {
    });

  }

  return component(results);

});


