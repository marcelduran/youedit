'use strict';

define(['components/flight/lib/component'], function(component) {

  function results() {
    var $innerEl,
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
        text = text.replace(RegExp('{{' + key + '}}', 'g'), data[key]);
      });

      return text;
    }

    this.init = function() {
      $innerEl = this.$node.find('ul');
      this.off(this.$node.parent(), 'autocompleteCreated');
    };

    this.reset = function() {
      console.log('results reset autocompleteOpen');
      this.$node.scrollTop(0);
    };

    this.render = function(ev, data) {
      $(t(data.item)).appendTo(data.ul).data('ui-autocomplete-item', data.item);
    };

    this.after('initialize', function() {
      this.on(this.$node.parent(), 'autocompleteCreated', this.init);
      this.on(this.$node.parent(), 'autocompleteOpen', this.reset);
      this.on(this.$node.parent(), 'renderSearchResults', this.render);
    });

  }

  return component(results);

});

