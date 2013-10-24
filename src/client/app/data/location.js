'use strict';

define([
  'flight/lib/component',
  'mixins/params'
], function(component, params) {

  function location() {

    this.set = (function () {
      return (window.history && window.history.replaceState) ?
        function (params) {
          window.history.replaceState(null, null, params ? '?' + params : '/');
        } :
        function (params) {
          window.location.hash = params;
        };
    }());

    this.update = function(ev, data) {
      console.log(this.toQueryString(data.list, data.keys));
    };

    this.after('initialize', function() {
      this.on(document, 'videoTrackUpdated', this.update);
      this.on(document, 'audioTrackUpdated', this.update);
    });

  }

  return component(location, params);

});
