'use strict';

define(['flight/lib/component'], function(component) {

  function preview() {

    this.defaultAttrs({
      bodySelector: 'body',
      videoSelector: '#video',
      editClass: 'edit',
      watchClass: 'watch',
      hasPlayerClass: 'has-player'
    });

    this.togglePreview = function() {
      $(this.attr.bodySelector)
        .removeClass(this.attr.editClass)
        .addClass(this.attr.watchClass);
      $(this.attr.videoSelector)
        .removeClass(this.attr.hasPlayerClass);

      this.trigger('startPreview');
    };

    this.preview = function(ev) {
      ev.preventDefault();

      if (this.watchLoaded) {
        return this.togglePreview();
      }

      require(['watch'], function(watch) {
        watch.initialize();
        this.watchLoaded = true;
        this.togglePreview();
      }.bind(this));
    };
  
    this.after('initialize', function() {
      this.$node.on('click', this.preview.bind(this));
    });
  }

  return component(preview);

});
