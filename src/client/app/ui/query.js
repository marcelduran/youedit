'use strict';

define(['components/flight/lib/component'], function(component) {

  function query() {

    this.after('initialize', function() {
      this.on('click', function() {console.log('query clicked')});
    });

  }

  return component(query);

});
