/*globall YUI*/
YUI.add('youedit-play', function (Y) {
    Y.log('play loaded');
    var
        // variables
        timer, begin, end, video, url, params,

        // uninitialized elements
        elTitle,
        
        // init vars
        videoInfo = {},
        stateProxy = Y.guid(),

        // shorthands
        ye = Y.namespace('YouEdit'),
        win = Y.config.win,
        doc = Y.config.doc,
        YArray = Y.Array,
        isFunction = Y.Lang.isFunction,
        arrayEach = YArray.each,
        map = YArray.map,
        YUIEnv = YUI.Env,
        YNcreate = Y.Node.create,

        // minifier helpers
        DECODE = win.decodeURIComponent,
        INT = function (s) {
            return parseInt(s, 10);
        },

        // regular expressions
        reValid = /^(?:v|i|o)$/, // v = video id, i = IN, o = OUT
        rePos = /^(?:i|o)$/, // clips position: i = IN, o = OUT
        reYTId = /(?:[&\?]v=|^)([\d\w\-_]+)(?:$|&)/, // get yt video id, e.g.: http://www.youtube.com/watch?v=3_1Y8UoLIu4 or simply id 3_1Y8UoLIu4
        reDigit = /^\d+$/, // 1 or more digit only, eg: 0, 1, 12

        // elements
        body = Y.one('body'),

        // get next video
        nextVideo = function () {
            ye.id = params.v.shift();

            if (!ye.id) {
                return;
            }

            params.ci = params.i.shift() || [];
            params.co = params.o.shift() || [];
            begin = params.ci.shift() || 0;
            end = params.co.shift() || Infinity;

            Y.log(['loaded: ' + ye.id, 'begin: ' + begin, 'end: ' + end]);
            return true;
        },
    
        // set video title
        setTitle = function (title) {
            if (ye.embed) {
                return;
            }

            title = YNcreate('<textarea></textarea>')
                .setContent(title)
                .get('value');
            elTitle.setContent(title);
            doc.title = 'YouEdit - ' + title;
        },

        /**
         * Set current video title.
         * @param {Object} info Optional video information from search result.
         */
        setCurrentVideoInfo = function (info) {
            var id = ye.id,
                video = videoInfo[id];

            if (!video && info) {
                video = videoInfo[id] = info;
            }

            if (video) {
                if (!video.pending) {
                    setTitle(video.title);
                }
            } else {
                ye.getVideoInfo(ye.id, setCurrentVideoInfo);
            }
        },

        /**
         * Load video.
         * @param {Object} info Optional video information from search result.
         */
        loadVideo = function (info) {
            var id = ye.id;

            begin = begin || 0;
            Y.log('loadVideo: ' + id + ', begin: ' + begin);

            // set current video info
            setCurrentVideoInfo(info);

            // create video or use the existing one
            if (!video) {
                video = ye.video = new Y.SWF('#player',
                    'http://www.youtube.com/e/' + id +
                    '?modestbranding=1&iv_load_policy=3&showinfo=0&rel=0&controls=0&autoplay=1&enablejsapi=1&version=3&start=' + begin, {
                    fixedAttributes: {
                        bgColor: '#000',
                        allowFullScreen: 'true',
                        allowScriptAccess: 'always'
                    }
                });
            } else {
                video.callSWF('loadVideoById', [id, begin]);
            }
        },

        // check time elapsed
        elapsed = function () {
            var current = ye.current = INT(
                video.callSWF('getCurrentTime'));
            if (current >= end) {
                begin = params.ci.shift();
                end = params.co.shift() || ye.duration;
                Y.log(['next clip:', begin, end]);
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

        /**
         * Get edit paramaters from querystring.
         * e.g: http://localhost:8000/?v=sG_JUCZf3mg,5gLr5gUZ-Hg&s=284,50,45|100,60&f=289,56,53|105,65
         */
        getParams = function () {
            var qs,
                params = {},
                loc = win.location, 
                s = loc.search,
                h = loc.hash,
                hash = h.slice(1).split('&'),
                idx = s.lastIndexOf('/');

            // remove heading "?" and trailing "/"
            idx = idx > -1 ? idx : s.length;
            qs = s.slice(1, idx).split('&');

            // parse querystring and hash, hash overrides
            Y.each(qs.concat(hash), function (entry) {
                var kv = entry.split('='),
                    key = DECODE(kv[0]),
                    val = DECODE(kv[1]);

                // skip invalid parameters
                if (!reValid.test(key)) {
                    return;
                }

                // get parameters:
                //     v = video id
                //     i = clip IN position
                //     o = clip OUT position
                params[key] = rePos.test(key) ?
                    // in/out positions
                    map(val.split('!'), function (block) {
                        var last;

                        return map(block.split('.'), function (n) {
                            n = (n === '~' ? last : base64To10(n));
                            last = n;

                            return n;
                        });
                    }) :
                    // video ids
                    map(val.split('.'), function (v, i, a) {
                        // check video id shortcuts
                        return reDigit.test(v) ? a[v] : v;
                    });
            });

            Y.log(['getParams', params]);
            Y.log(['getParams v', JSON.stringify(params.v, null)]);
            Y.log(['getParams i', JSON.stringify(params.i, null)]);
            Y.log(['getParams o', JSON.stringify(params.o, null)]);
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
                    duration: INT(
                        video.media$group.yt$duration.seconds)
                };
                videoInfo[id] = video;

                Y.log(['videoInfo', videoInfo]);
                if (typeof callback === 'function') {
                    return callback(video);
                }
            }
        },

        // init common markup
        initCommon = function () {
            elTitle = YNcreate('<h1 id="title"></h1>');
            Y.one('#vd')
                .append(elTitle)
                .append('<div id="player"></div>');
        },
        
        // init markup for playback
        initMarkup = function () {
            body.addClass('play');
            Y.one('#md')
                .append('<button id="edit-btn">edit</button>');

            // events delegation
            body.delegate('click', setEditMode, '#edit-btn');
        },
        
        // convert base 10 numbers into base 64
        // e.g.: 0 -> 0, 10 -> a, 61 -> Z, 62 -> -, 63 -> _ 
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
                q = INT(q / 64);
                c = code(r + (r < 10 ? 48 : r < 36 ? 55 : r < 62 ? 61 : r < 63 ? -17 : 32));
                result = c.toString() + result;
            }
            
            return result;
        },

        // convert base 64 numbers into base 10.
        // e.g.: 0 -> 0, a -> 10, Z -> 61, - -> 62, _ -> 63 
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
        },
        
        // switch to edit mode
        setEditMode = function () {
            //body.addClass('edit');
            Y.use('youedit-edit');
        };

    // global YT callback
    win.onYouTubePlayerReady = function (playerId) {
        Y.log(['youtube player ready', playerId]);
        video.callSWF('addEventListener', ['onStateChange', 'YUI.Env.YouEdit.' +
            stateProxy]);
        timer = Y.later(500, this, elapsed, null, true);
    };

    // publish video change
    YUIEnv.YouEdit = YUIEnv.YouEdit || {};
    YUIEnv.YouEdit[stateProxy] = function (state) {
        //Y.log(['youtube player state change', state]);
        var curl = video.callSWF('getVideoUrl');

        // video change
        if (curl !== url) {
            url = curl;
            ye.id = parseVideoId(curl);
            Y.log('video id: ' + ye.id);
            duration = video.callSWF('getDuration');
            ye.duration = duration;
            // set end to duration if currently infinity
            if (end === Infinity) {
                end = duration;
            }
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
            var video = videoInfo[id];
            if (!video) {
                videoInfo[id] = {pending: 1};
                Y.jsonp('http://gdata.youtube.com/feeds/api/videos/' + id +
                    '?v=2&alt=json-in-script&callback={callback}', {
                        on: {
                            success: parseVideoInfo
                            // TODO: failure: videoInfoError
                            // TODO: timeout: videoInfoTimeout
                        },
                        args: [id, callback]
                    }
                );
            } else if (isFunction(callback)) {
                callback(video);
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
            initCommon();
            if (!ye.edit) {
                initMarkup();
            }
        }

        if (params && nextVideo()) {
            loadVideo();
            ye.getVideoInfo(params.v);
        }
    };

    // expose api
    ye.videoInfo = videoInfo;
    ye.parseVideoId = parseVideoId;
    ye.loadVideo = loadVideo;
    ye.getParams = getParams;
    ye.base10To64 = base10To64;
}, '0.0.1', {
    requires: ['swf', 'node', 'array-extras', 'jsonp']
});
