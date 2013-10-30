'use strict';

define([
  'flight/lib/component'
], function(component) {

  function player() {

    this.defaultAttrs({
    });

    this.start = function(ev, data) {
      console.log(data);
    };

    this.after('initialize', function() {
      this.on(document, 'metainfoParsed', this.start);
    });
  }

  return component(player);

});

