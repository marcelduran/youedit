'use strict';

requirejs.config({
  paths: {
    'flight': '../flight',
    'jquery': '../jquery/jquery',
    'jqueryui': '../jqueryui'
  }
});

require(['jquery', 'edit'], function($, edit) {
  window.$ = window.jQuery = $;
  edit();
});
