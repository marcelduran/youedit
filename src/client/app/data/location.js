'use strict';

define([
  'flight/lib/component',
  'mixins/params'
], function(component, params) {

  function location() {

    var reValidTitleChars = /[^\w\d\-_!\(\)\*\.]/g,
        reSpace = / /g;

    this.uri = {
      video: '',
      audio: ''
    };

    this.set = (function () {
      return (window.history && window.history.replaceState) ?
        function (params, title) {
          window.history.replaceState(null, null, [title, params].join('?'));
        } :
        function (params, title) {
          window.location.hash = [title, params].join('?');
        };
    }());

    this.update = function(track, ev, data) {
      this.uri[track] = this.toQueryString(data.list, data.keys);
      this.set([this.uri.video, this.uri.audio]
        .join(this.uri.audio ? '&' : ''));
    };

    this.titleToUrl = function(title) {
      return title.toLowerCase()
        .replace(reSpace, '_')
        .replace(reValidTitleChars, '');
    };

    this.updateTitle = function(ev, data) {
      this.set([this.uri.video, this.uri.audio]
        .join(this.uri.audio ? '&' : ''), this.titleToUrl(data.title));
    };

    this.after('initialize', function() {
      this.on(document, 'videoTrackUpdated', this.update.bind(this, 'video'));
      this.on(document, 'audioTrackUpdated', this.update.bind(this, 'audio'));
      this.on(document, 'titleChanged', this.updateTitle);
    });

  }

  return component(location, params);

});
