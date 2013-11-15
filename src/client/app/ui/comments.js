'use strict';

define(['flight/lib/component'], function(component) {

  function comments() {

    this.defaultAttrs({
      shortname: 'youedit',
      url: '//youedit.disqus.com/embed.js'
    });

    this.after('initialize', function() {
      window.disqus_shortname = this.attr.shortname;
      $.getScript(this.attr.url);
    });

  }

  return component(comments);

});

