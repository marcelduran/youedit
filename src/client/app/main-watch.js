'use strict';

requirejs.config({
  paths: {
    'flight': '../flight',
    'jquery': '../jquery/jquery',
  }
});

require(['jquery', 'watch'], function($, watch) {
  window.$ = window.jQuery = $;
  watch.initialize();
});
