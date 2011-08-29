YUI_config = {
    filter: 'raw',
    groups: {
        youedit: {
            combine: false,
            base: './js/',
            comboBase: './js/',
            root: '_',
            modules: {
                'youedit-play': {
                    path: 'play.js',
                    requires: ['swf', 'node', 'array-extras', 'jsonp']
                },
                'youedit-edit': {
                    path: 'edit.js',
                    requires: ['youedit-play', 'event-delegate', 'slider',
                        'gallery-torelativetime', 'youedit-edit-dd']
                },
                'youedit-edit-dd': {
                    path: 'edit-dd.js',
                    requires: ['dd-constrain', 'dd-proxy', 'dd-drop',
                        'dd-scroll']
                },
                'youedit-embed': {
                    path: 'embed.js',
                    requires: ['youedit-play']
                }
            }
        }
    }
};

YUI().use(
    // core
    'youedit-play',

    // load strategy:

    // load in edit mode if no parameters found
    (!location.search && !location.hash ? 'youedit-edit' : 

    // load in embedded mode if "e" param is found, eg: e, e=1, e=true, e=0 etc
    /(?:^|[\?&#])e(?:=)?([\d\w]*)/
        .test(location.search + location.hash) ? 'youedit-embed' : ''),

    function (Y) {
        Y.namespace('YouEdit').init();
    }
);
