'use strict';

define(['components/flight/lib/component'], function(component) {

  function query() {
    var $node;

    this.defaultAttrs({
      resultsSelector: '#results'
    });

    this.init = function() {
      $node.autocomplete({
        minLength: 0,
        source: function(request, response) {
          this.trigger('newQuery', {request: request, response: response});
        }.bind(this),
        appendTo: this.attr.resultsSelector,
        create: function() {
          $node.autocomplete().data('ui-autocomplete')._close = $.noop;
          this.trigger('autocompleteCreated');
        }.bind(this),
        select: function(ev, ui) {
          $node.val(ui.item.title);
          setTimeout($node.focus, 0);
          return false;
        },
        open: function() {
          this.trigger('autocompleteOpen');
        }.bind(this)
      }).data('ui-autocomplete')._renderItemData = function(ul, item) {
        this.trigger('renderSearchResults', {ul: ul, item: item});
      }.bind(this);
    };

    this.after('initialize', function() {
      $node = this.$node;
      this.init();
    });

  }

  return component(query);

});
