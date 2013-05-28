'use strict';

define(['components/flight/lib/component'], function(component) {

  function results() {

    this.after('initialize', function() {
      this.on('click', function() {console.log('results data clicked')});
    });

  }

  return component(results);

});


