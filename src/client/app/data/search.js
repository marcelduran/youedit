'use strict';

define(['components/flight/lib/component'], function(component) {

  function search() {

    this.newQuery = function(ev, data) {
      data.response([
        {id: 'ylLzyHk54Z0', duration: 10, title: 'foo ' + data.request.term, author: 'bar', pub: new Date(), views: 3, shard: 1},
        {id: '4PkcfQtibmU', duration: 20, title: 'moo', author: 'mar', pub: new Date(), views: 6, shard: 1},
        {id: 'G1cjHbXdU0s', duration: 30, title: 'too', author: 'tar', pub: new Date(), views: 9, shard: 1}
      ]);
    };

    this.after('initialize', function() {
      this.on('newQuery', this.newQuery);
    });

  }

  return component(search);

});

