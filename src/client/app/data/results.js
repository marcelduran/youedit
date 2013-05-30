'use strict';

define(['components/flight/lib/component'], function(component) {

  function results() {

    this.after('initialize', function() {
    });

  }

  return component(results);

});


