YUI_config = {
    filter: 'raw',
    groups: {
        youedit: {
            base: './js/',
            modules: {
                'youedit-play': {
                    path: 'play.js',
                    requires: ['swf', 'node', 'array-extras', 'jsonp']
                },
                'youedit-edit': {
                    path: 'edit.js',
                    requires: ['youedit-play', 'event-delegate', 'slider',
                        'youedit-edit-dd']
                },
                'youedit-edit-dd': {
                    path: 'edit-dd.js',
                    requires: ['dd-constrain', 'dd-proxy', 'dd-drop',
                        'dd-scroll']
                }
            }
        }
    }
};

YUI().use(
    'youedit-play',
    // load strategy: load in edit mode if no parameters found
    (!location.search && !location.hash ? 'youedit-edit' : ''),
    function (Y) {
        Y.namespace('YouEdit').init();
    }
);
