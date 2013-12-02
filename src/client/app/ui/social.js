'use strict';

define(['flight/lib/component'], function(component) {

  function social() {

    this.defaultAttrs({
      urls: [
        '//platform.twitter.com/widgets.js',
        '//connect.facebook.net/en_US/all.js#xfbml=1',
        '//apis.google.com/js/platform.js'
      ]
    });

    this.init = function() {
      var fjs = $('script')[0];
      this.attr.urls.forEach(function(url) {
        var js = document.createElement('script');
        js.src = url;
        js.async = true;
        fjs.parentNode.insertBefore(js, fjs);
      });
    };

    this.after('initialize', function() {
      this.on(document, 'playbackStarted', this.init);
    });

  }

  return component(social);

});
