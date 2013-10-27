'use strict';

define(['flight/lib/component'], function(component) {

  function title() {

    this.titleChanged = function(ev) {
      var newTitle = $(ev.target).val();

      this.trigger(document, 'titleChanged', {title: newTitle});
    };
  
    this.after('initialize', function() {
      this.$node.on('change', this.titleChanged.bind(this));
    });
  }

  return component(title);

});
