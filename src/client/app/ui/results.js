'use strict';

define(['flight/lib/component'], function(component) {

  function results() {
    var $node, $innerEl, innerHeight, outerHeight, more, scrollTimeout,
        template = '<li class="ui-menu-item">' +
          '<a>' +
          '<span class="clip">' +
          '<img src="http://i{{shard}}.ytimg.com/vi/{{id}}/default.jpg">' +
          '<span class="duration">{{duration}}</span>' +
          '</span>' +
          '<h2 title="{{title}}">{{title}}</h2>' +
          '<p>{{author}}</p>' +
          '<p>{{views}}</p>' +
          '<p>{{pub}}</p>' +
          '</a>' +
          '</li>';

    function t(data) {
      var text = template;

      Object.keys(data).forEach(function(key) {
        text = text.replace(new RegExp('{{' + key + '}}', 'g'), data[key]);
      });

      return text;
    }

    this.defaultAttrs({
      fetchingClass: 'ui-state-fetching',
      scrollBuffer: 84
    });

    // infinite scroll
    $.event.special.smartscroll = {
      setup: function() {
        $(this).bind('scroll', $.event.special.smartscroll.handler);
      },
      teardown: function() {
        $(this).unbind('scroll', $.event.special.smartscroll.handler);
      },
      handler: function(event) {
        // Save the context
        var context = this,
            args = arguments;

        // set correct event type
        event.type = 'smartscroll';

        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(function() {
          $(context).trigger('smartscroll', args);
        }, 100);
      }
    };

    this.appendResults = function(results) {
      results.forEach(function(item) {
        this.render(null, {ul: $innerEl, item: item});
      }.bind(this));
    };

    this.infiniteScroll = function() {
      var reachedEnd = (innerHeight - $node.scrollTop() - outerHeight) -
            this.attr.scrollBuffer <= 0;

      if (reachedEnd && more && !$node.hasClass(this.attr.fetchingClass)) {
        this.trigger('newQuery', {
          start: 10,
          response: this.appendResults.bind(this)
        });
      }
    };

    this.init = function() {
      $innerEl = $node.find('ul');
      outerHeight = $node.height();
      this.off($node.parent(), 'autocompleteCreated');
    };

    this.reset = function() {
      $node.scrollTop(0);
    };

    this.render = function(ev, data) {
      $(t(data.item)).appendTo(data.ul).data('ui-autocomplete-item', data.item);
    };

    this.fetching = function() {
      $node.addClass(this.attr.fetchingClass);
    };

    this.fetchingDone = function() {
      $node.removeClass(this.attr.fetchingClass);
      // update current results list height
      innerHeight = $innerEl.height();
    };

    this.newResults = function(ev, data) {
      more = data.more;
    };

    this.after('initialize', function() {
      var $parent;

      $node = this.$node,
      $parent = $node.parent();

      this.on($parent, 'autocompleteCreated', this.init);
      this.on($parent, 'autocompleteOpen', this.reset);
      this.on($parent, 'renderSearchResults', this.render);
      this.on($parent, 'newQuery', this.fetching);
      this.on($parent, 'searchComplete', this.fetchingDone);
      this.on($parent, 'newResults', this.newResults);
      $node.on('smartscroll', this.infiniteScroll.bind(this));
    });

  }

  return component(results);

});

