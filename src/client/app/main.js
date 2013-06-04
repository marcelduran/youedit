'use strict';

requirejs.config({paths: {flight: '../flight'}});

require(['edit'], function(edit) {
  edit();
});
