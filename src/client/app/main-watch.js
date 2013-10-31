'use strict';

requirejs.config({
  paths: {
    'flight': '../flight',
    'jquery': '../jquery/jquery',
    'swfobject': '../swfobject'
  }
});

require(['jquery', 'watch'], function($, watch) {
  window.$ = window.jQuery = $;
  watch.initialize();
});
