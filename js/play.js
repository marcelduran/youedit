/*globall YUI*/
YUI.add('youedit-play', function (Y) {
    var timer, begin, end,
        video, url, params,

        ye = Y.namespace('YouEdit'),
        win = Y.config.win,
        doc = Y.config.doc,
        decode = win.decodeURIComponent,
        YArray = Y.Array,
        arrayEach = YArray.each,
        map = YArray.map,

        stateProxy = Y.guid(),
        buffer = [],
        bufSize = 4,

        // regular expressions
        reValid = /^(?:v|s|f)$/, // v = video id, s = start, f = finish
        reMarks = /^(?:s|f)$/,
        reYTId = /(?:[&\?]v=|^)([\d\w\-_]+)(?:$|&)/, // get yt video id, e.g.: http://www.youtube.com/watch?v=3_1Y8UoLIu4 or simply id 3_1Y8UoLIu4
        reDigit = /^\d+$/, // 1 or more digit only, eg: 0, 1, 12
        reDebug = /(?:^|[\?&#])d(?:=)?([\d\w]*)/, // debug, eg: d, d=1, d=true, d=0 etc
        reEmbed = /(?:^|[\?&#])e(?:=)?([\d\w]*)/, // embed, eg: e, e=1, e=true, e=0 etc

        // get next video
        nextVideo = function () {
            ye.id = params.v.shift();

            if (!ye.id) {
                return;
            }

            params.cs = params.s.shift() || [];
            params.cf = params.f.shift() || [];
            begin = params.cs.shift() || 0;
            end = params.cf.shift() || ye.duration;

            Y.log('loaded: ' + ye.id);
            Y.log(['begin: ' + begin, 'end: ' + end]);
            return true;
        },
    
        // set video title
        setTitle = function (title) {
            if (ye.embed) {
                return;
            }

            title = Y.Node.create('<textarea></textarea>')
                .setContent(title)
                .get('value');
            Y.one('#title').setContent(title);
            doc.title = 'YouEdit - ' + title;
        },

        // set current video title
        setCurrentVideoInfo = function () {
            var video = ye.videoInfo[ye.id];

            if (video) {
                if (!video.pending) {
                    setTitle(video.title);
                }
            } else {
                ye.getVideoInfo(ye.id, setCurrentVideoInfo);
            }
        },

        // load video
        loadVideo = function () {
            var id = ye.id;

            begin = begin || 0;
            Y.log('loadVideo: ' + id + ', begin: ' + begin);

            if (!video) {
                video = ye.video = new Y.SWF('#video',
                    'http://www.youtube.com/e/' + id +
                    '?controls=0&autoplay=1&enablejsapi=1&version=3&start=' + begin, {
                    fixedAttributes: {
                        bgColor: '#000',
                        allowFullScreen: 'true',
                        allowScriptAccess: 'always'
                    }
                });
            } else {
                video.callSWF('loadVideoById', [id, begin]);
            }

            // set current video info
            setCurrentVideoInfo();
        },

        // check time elapsed
        elapsed = function () {
            var current = ye.current = parseInt(
                video.callSWF('getCurrentTime'), 10);
            if (current > end) {
                begin = params.cs.shift();
                end = params.cf.shift() || ye.duration;
                Y.log([begin, end]);
                if (begin && end && begin < end) {
                    video.callSWF('seekTo', [begin, true]);
                } else if (nextVideo()) {
                    loadVideo();
                } else {
                    video.callSWF('stopVideo');
                    timer.cancel();
                }
            }
        },

        // get parameters
        // e.g: http://localhost:8000/?v=sG_JUCZf3mg,5gLr5gUZ-Hg&s=284,50,45|100,60&f=289,56,53|105,65
        getParams = function () {
            var debug, embed, qs,
                params = {},
                loc = win.location, 
                s = loc.search,
                h = loc.hash,
                hash = h.slice(1).split('&'),
                idx = s.lastIndexOf('/');

            // remove heading "?" and trailing "/"
            idx = idx > -1 ? idx : s.length;
            qs = s.slice(1, idx).split('&');

            // check for debuggin mode
            debug = reDebug.exec(s + h);
            debug = debug && debug[1];
            ye.debug = debug = (debug || debug === '');
            Y.log(['debug', debug]);

            // check for embedded mode
            embed = reEmbed.exec(s + h);
            embed = embed && embed[1];
            ye.embed = embed = (embed || embed === '');
            Y.log(['embed', embed]);

            // parse querystring and hash, hash overrides
            Y.each(qs.concat(hash), function (entry) {
                var kv = entry.split('='),
                    key = decode(kv[0]),
                    val = decode(kv[1]);

                // skip invalid parameters
                if (!reValid.test(key)) {
                    return;
                }

                // get parameters:
                //     v = video id
                //     s = start point
                //     f = finish point
                params[key] = reMarks.test(key) ?
                    // start/finish marks
                    map(val.split('|'), function (block) {
                        var last;

                        return map(block.split(','), function (n) {
                            n = (n === '-' ? last : parseInt(n, debug ? 10 : 36));
                            last = n;

                            return n;
                        });
                    }) :
                    // video ids
                    map(val.split(','), function (v, i, a) {
                        // check video id shortcuts
                        return reDigit.test(v) ? a[v] : v;
                    });
            });

            Y.log(['getParams', params]);
            return params.v && params; 
        },

        // parse video id from url or id
        parseVideoId = function (str) {
            Y.log('str: ' + str);
            str = reYTId.exec(str);

            Y.log('ret: ' + (str && str[1]));
            return str && str[1];
        },

        // parse json response
        parseVideoInfo = function (res, id, callback) {
            Y.log(['parseVideoInfo', res]);
            var video = res && res.entry;
            
            if (video) {
                video = {
                    id: id,
                    title: video.title.$t,
                    duration: parseInt(
                        video.media$group.yt$duration.seconds, 10)
                };
                ye.videoInfo[id] = video;

                Y.log(['videoInfo', ye.videoInfo]);
                if (typeof callback === 'function') {
                    return callback(video);
                }
            }
        },
        
        // init markup for playback (not embedded)
        initMarkup = function () {
            Y.one('body')
                .prepend('<h1 id="title"></h1>')
                .append('<button id="edit">edit</button>')
                .append('<div id="ft">{{ version }}</div>');
        },
        
        // init embedded mode
        initEmbed = function () {
            Y.one('body').addClass('embed');
            Y.one('#video')
                .setStyle('height', Y.DOM.winHeight() + 'px');
        };

        base10To64 = function (n) {
            var r, c,
                q = n,
                result = '',
                code = String.fromCharCode;
            
            if (n === 0) {
                return '0';
            }
            
            while (q > 0) {
                r = q % 64;
                q = parseInt(q / 64);
                c = code(r + (r < 10 ? 48 : r < 36 ? 55 : r < 62 ? 61 : r < 63 ? -17 : 32));
                result = c.toString() + result;
            }
            
            return result;
        },

        base64To10 = function (n) {
            var i, c, x,
                result = 0,
                len = n.length - 1,
                pow = Math.pow;
            
            for (i = len; i >= 0; i -= 1) {
                c = n.charCodeAt(i);
                x = c - (c < 48 ? -17 : c < 65 ? 48 : c < 91 ? 55 : c < 96 ? 32 : 61);
                result += x * pow(64, len - i);
            }
            
            return result;
        };

    // global YT callback
    win.onYouTubePlayerReady = function () {
        video.callSWF('addEventListener', ['onStateChange', 'YUI.Env.YouEdit.' +
            stateProxy]);
        timer = Y.later(500, this, elapsed, null, true);
    };

    // publish video change
    YUI.Env.YouEdit = YUI.Env.YouEdit || {};
    YUI.Env.YouEdit[stateProxy] = function () {
        var curl = video.callSWF('getVideoUrl');

        // video change
        //Y.log(['curl: ' + curl, 'url: ' + url]);
        if (curl !== url) {
            url = curl;
            ye.id = parseVideoId(curl);
            Y.log('video id: ' + ye.id);
            ye.duration = video.callSWF('getDuration');
            Y.log('duration: ' + ye.duration);
            Y.Global.fire('ye:videoChange', {
                id: ye.id,
                duration: ye.duration
            });
        }
    };

    // get info from gdata
    ye.getVideoInfo = function (ids, callback) {
        // get only video info for new videos
        ids = Y.Array(ids);
        arrayEach(ids, function (id) {
            var videoInfo = ye.videoInfo[id];
            if (!videoInfo) {
                ye.videoInfo[id] = {pending: 1};
                Y.jsonp('http://gdata.youtube.com/feeds/api/videos/' + id +
                    '?v=2&alt=json-in-script&callback={callback}', {
                        on: {
                            success: parseVideoInfo
                            // TODO: parseVideoInfoError
                        },
                        args: [id, callback]
                    }
                );
            } else if (typeof callback === 'function') {
                callback(videoInfo);
            }
        }); 
    };

    // cancel timer (edit mode)
    ye.cancelPlayTimer = function () {
        if (timer) {
            timer.cancel();
            if (video) {
                video.callSWF('stopVideo');
            }
            begin = 0;
            Y.log('play timer canceled');
        }
    };

    // initializer
    ye.init = function () {
        params = getParams();

        if (!ye.embed) {
            initMarkup();
            // TODO: move to delegate if > 1 button
            Y.one('#edit').on('click', function () {
                // set edit mode
                Y.one('body').addClass('edit-mode');

                Y.use('youedit-edit');
            });
        } else {
            initEmbed();
        }

        if (params && nextVideo()) {
            loadVideo();
            ye.getVideoInfo(params.v);
        } else {
            // load edit here
        }
    };

    // expose api
    ye.videoInfo = {};
    ye.parseVideoId = parseVideoId;
    ye.loadVideo = loadVideo;
    ye.getParams = getParams;
}, '0.0.1', {
    requires: ['swf', 'node', 'array-extras', 'jsonp']
});
