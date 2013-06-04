'use strict';

define(['flight/lib/component'], function(component) {

  function search() {
    var start, term, response;

    this.newQuery = function(ev, data) {
      start = data.hasOwnProperty('start') ? start + data.start : 1;
      term = data.hasOwnProperty('request') ? data.request.term : term;
      response = data.response;
      this.searchVideos();
    };

    this.searchVideos = function() {
      $.ajax({
        url: 'http://gdata.youtube.com/feeds/api/videos',
        dataType: 'jsonp',
        timeout: 10000,
        data: {
          v: 2,
          alt: 'json-in-script',
          'max-results': 10,
          q: term,
          'start-index': start,
          format: 5,
          fields: 'entry(' +
                         'title,' +
                         'author(name),' +
                         'media:group(' +
                                      'yt:videoid,' +
                                      'yt:duration(@seconds)' +
                         '),' +
                         'yt:statistics(@viewCount),' +
                         'published' +
                  '),' +
                  'openSearch:totalResults'
        },
        success: this.results.bind(this),
        complete: function() {
          this.trigger('searchComplete');
        }.bind(this)
      });
    };

    this.results = function(data) {
      if (!(data && data.feed && data.feed.entry)) {
        return this.trigger('newResults', {more: false});
      }

      if ((start + 10) <
          parseInt(data.feed.openSearch$totalResults.$t, 10)) {
        this.trigger('newResults', {more: true});
      }

      response($.map(data.feed.entry, function(item, index) {
        var media = item.media$group,
            stats = item.yt$statistics,
            shard = index % 5;

        return {
          id: media.yt$videoid.$t,
          duration: parseInt(media.yt$duration.seconds, 10),
          title: item.title.$t,
          author: item.author[0].name.$t,
          pub: new Date(item.published.$t),
          views: ((stats && parseInt(stats.viewCount, 10)) || 0).toLocaleString(10),
          shard: shard || ''
        };
      }));
    };

    this.after('initialize', function() {
      this.on('newQuery', this.newQuery);
    });

  }

  return component(search);

});

