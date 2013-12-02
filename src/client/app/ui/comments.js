'use strict';

define(['flight/lib/component'], function(component) {

  function comments() {

    this.defaultAttrs({
      shortname: 'youedit',
      url: '//youedit.disqus.com/embed.js'
    });

    this.init = function() {
      window.disqus_shortname = this.attr.shortname;
      $.getScript(this.attr.url);
    };

    this.after('initialize', function() {
      this.on(document, 'playbackStarted', this.init);
    });

  }

  return component(comments);

});

