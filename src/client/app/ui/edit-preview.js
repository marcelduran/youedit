'use strict';

define(['flight/lib/component'], function(component) {

  function preview() {

    this.preview = function(ev) {
      ev.preventDefault();
      require(['watch'], function(watch) {
        $('body').removeClass('edit').addClass('watch');
        watch.initialize();
      });
    };
  
    this.after('initialize', function() {
      this.$node.on('click', this.preview.bind(this));
    });
  }

  return component(preview);

});
