'use strict';

requirejs.config({
  paths: {
    'flight': '../flight',
    'jquery': '../jquery/jquery',
    'jqueryui': '../jqueryui',
    'swfobject': '../swfobject'
  }
});

require(['jquery', 'edit'], function($, edit) {
  window.$ = window.jQuery = $;
  edit();
});
