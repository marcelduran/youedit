/*globall YUI*/
YUI.add('youedit-embed', function (Y) {
    var ye = Y.namespace('YouEdit'),
        init = function () {
            Y.one('body').addClass('embed');
            Y.one('#player')
                .setStyle('height', Y.DOM.winHeight() + 'px');
        };

    ye.embed = 1;
    init();
}, '0.0.1', {
    requires: ['youedit-play'],
});
