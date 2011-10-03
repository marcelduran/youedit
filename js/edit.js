YUI.add('youedit-edit', function (Y) {
    Y.log('edit loaded');
    var 
        // variables
        lastQuery, lastStart, dts,

        // element variables
        elSearch, elUrl, elTimeFrames,
        elResults, elSearchArea, elClip, elEditArea,

        // initialized variables
        edits = [],

        // shorthands
        ye = Y.namespace('YouEdit'),
        win = Y.config.win,
        YNcreate = Y.Node.create,
        YArray = Y.Array,
        arrayEach = YArray.each,
        video = ye.video,
        YGlobal = Y.Global,
        Ybind = Y.bind,
        base10To64 = ye.base10To64,

        // minifier helpers
        ENCODE = encodeURIComponent,
        INT = function (s) {
            return parseInt(s, 10);
        },

        // elements
        body = Y.one('body'),

        // convert s in m:s
        convertTime = function (s) {
            var h, m, ss, hour, min;

            if (isNaN(s)) {
                return s;
            }

            h = INT(s / 3600);
            m = INT((s % 3600) / 60);
            ss = s - (m * 60) - (h * 3600);
            hour = s >= 3600;
            min = s >= 60;

            return (hour ? (h < 10 ? '0' : '') + h + ':' : '') +
                (min ? (m < 10 && hour ? '0' : '') + m + ':' : '') +
                (!min ? '0:' : '') +
                (ss < 10 ? '0' : '') + ss;
        },

        // convert m:s in s
        toSec = function (h) {
            var i, v,
                r = 0,
                factor = 1,
                m = /(\d{0,2}):?(\d{0,2}):?(\d{0,2})/.exec(h);
            
            for (i = 3; i > 0; i -= 1) {
                v = parseInt(m[i], 10);
                if (v || v === 0) {
                    r += v * factor;
                    factor *= 60;
                }
            }
                
            return factor === 1 ? false : r;
        },

        /** 
         * Build parameters from edits
         */
        buildParams = function () {
            var id, hid, marks, i, o, lastI, lastO,
                ids = {},
                v = [],
                I = [],
                O = [];

            arrayEach(edits, function (edit, indexEdit) {
                var val;

                // INs and OUTs
                if (id !== edit.id) {
                    if (i) {
                        I.push(i.join('.'));
                        O.push(o.join('.'));
                    }
                    id = edit.id;
                    o = [];
                    i = [];
                    lastI = lastO = null;

                    // hash of unique ids
                    hid = ids[id];
                    if (hid > -1) {
                        v.push(hid);
                    } else {
                        v.push(id);
                        ids[id] = v.length - 1;
                    }
                }

                // ommit value for begin and end of video length
                val = edit.i;
                i.push(!val ? null : val === lastI ? '~' :
                    base10To64(val));
                lastI = val;
                val = edit.o;
                o.push(val === Infinity ? null : val === lastO ? '~' :
                    base10To64(val));
                lastO = val;
            });
            if (i) {
                I.push(i.join('.'));
                O.push(o.join('.'));
            }

            YGlobal.fire('ye:paramsBuilt',
                (!v.length && !I.length && !O.length) ? '' :
                'v=' + v.join('.') + '&i=' + I.join('!') + '&o=' + O.join('!')
            );
        },
        
        /** 
         * Build edits from parameters
         */
        buildEdits = function () {
            var params = ye.getParams();

            if (!params) {
                return;
            }

            ins = params.i;
            outs = params.o;
            arrayEach(params.v, function (vid, indexVideo) {
                var clipsIn = ins[indexVideo],
                    clipsOut = outs[indexVideo];
                arrayEach(clipsIn, function (clipIn, indexClip) {
                    edits.push({
                        id: vid,
                        i: clipIn || 0,
                        o: clipsOut[indexClip] || Infinity
                    });
                });
            });
            Y.log(['buildEdits', edits]);
        },

        /**
         * Set location using either pushState when available or
         * hash as a fallback.
         */
        setLocation = (function () {
            return (win.history && win.history.replaceState) ?
                function (params) {
                    win.history.replaceState(null, null,
                        params ? '?' + params : '/');
                } :
                function (params) {
                    win.location.hash = params;
                };
        }()),
        
        /**
         * Set preview url and location hash with editing params.
         * @param {String} params Editing parameters (querystring-like).
         */
        setUrlsParams = function (params) {
            var loc = win.location,
                search = loc.search,
                idx = search.lastIndexOf('/');

            idx = idx > -1 ? idx : search.length;
            Y.log(['setUrls', params]);
            if (params === search.slice(1, idx)) {
                return;
            }

            elUrl.set('value', loc.protocol + '//' + loc.host +
                loc.pathname + (params ? '?' + params : ''));
            setLocation(params);
        },

        /** 
         * Insert clip.
         * @param {Object} clip The clip to be inserted.
         * @param {Number} index Index at which to insert clip, if ommited
         *        clip will be appended.
         * @return {Number} The index of inserted clip.
         */
        insertClip = function (clip, index) {
            if (typeof index !== 'undefined') {
                edits.splice(index, 0, clip);
            } else {
                edits.push(clip);
                index = edits.length - 1;
            }

            return index;
        },
        
        /**
         * Adjust frames indexes
         * @param {Node} frame The frame to start updating indexes from (inclusive).
         * @param {Number} index The starting index.
         */
        adjustFrameIndexes = function (frame, index) {
            while (frame) {
                frame.setData('index', index);
                index += 1;
                frame = frame.next();
            }
        },

        /** 
         * Remove clip from timeline.
         * @param {Event} The event from frame delete button.
         */
        removeClip = function (e) {
            var frame = e.target.ancestor('li'),
                index = frame.getData('index');

            edits.splice(index, 1);
            adjustFrameIndexes(frame.next(), index);
            frame.remove();

            YGlobal.fire('ye:clipRemoved');
        },

        /**
         * Insert a clip to timeline.
         * @param {Object} clip Optional clip to be appended, if ommited the
         *        current selection is used instead.
         * @param {Boolean} initializing Optional flag indicatiing the timeline
         *        is initializing, thus not firing ye:clipAppended event.
         */
        appendClip = function (clip, initializing) {
            var index, frame;

            clip = clip || getCurrentClip();
            index = insertClip(clip);
            frame = createFrame(clip);

            frame.setData('index', index);
            elTimeFrames.append(frame);
            ye.ddFrame(frame);

            if (!initializing) {
                YGlobal.fire('ye:clipAppended', clip);
            }
        },

        // get new video
        getVideo = function (ev) {
            var id = ev.currentTarget.getData('info').id;

            Y.log('get video: ' + id);
            ev.preventDefault();

            if (!id) {
                return;
            }

            ye.id = id;
            ye.loadVideo();
            video = ye.video;
        },

        // update video info on change
        videoChange = function (info) {
            var duration = info.duration;
            Y.log(['videoChange', info]);

            //elVid.set('value', info.id);
            dts.set('range', {max: duration});
            dts.update(0, duration);
        },

        /**
         * Seek video position
         * @param {Number} position The desired video time position in seconds.
         * @param {Boolean} seekAhead Look ahead of what's buffered,
         *        should be true only when control thumb drag ends.
         */
        seekVideo = function (position, seekAhead) {
            if (video) {
                video.callSWF('seekTo', [position, seekAhead]);
                video.callSWF('pauseVideo');
            }
        },

        /**
         * Update video/inputs on thumb sliders change.
         * @param {Event} e The facade event fired when dual thumb sliders
         *        value change.
         */
        updatePos = function (e) {
            var newVal = e.newVal,
                min = newVal.min,
                max = newVal.max,
                value = min !== e.prevVal.min ? min : max;
            
            elClip.setContent(convertTime(max - min));
            ye.current = value;
            seekVideo(value, false);
        },

        /**
         * Show current video position (look ahead)
         * @param {Event} e The facade event fired when dual thumb sliders
         *        drag end.
         */
        videoPos = function (e) {
            Y.log(['videoPos', e]);
            seekVideo(e[e.changed], true);
        },

        // preview edition
        preview = function () {
            var previewUrl = elUrl.get('value');

            if (previewUrl) {
                win.location.assign(previewUrl);
            }
        },
        
        // multi subscriber
        // accepts 1..n event types and 1..m callback functions
        multiscriber = function (types, fns) {
            arrayEach(YArray(types), function (type) {
                arrayEach(YArray(fns), function (fn) {
                    YGlobal.on(type, fn);
                });
            });
        },

        /**
         * Get the current clip.
         * @return {Object} The clip object containing:
         *         id: video id,
         *         i: clip IN position in seconds,
         *         o: clip OUT position in seconds.
         */
        getCurrentClip = function () {
            var value = dts.get('value'),
                max = value.max;

            if (max === ye.duration) {
                max = Infinity;
            }

            return {
                id: ye.id,
                i: value.min,
                o: max
            };
        },

        /**
         * Create a timeline frame.
         * @param {Object} edit The edit object with:
         *        id: video id,
         *        i: clip IN position in seconds,
         *        o: clip OUT position in seconds.
         * @param {Node} [frame] The frame to get clip content
         *        if ommited, a new frame Node is created.
         * @return {Node} The frame node with clip content.
         */
        createFrame = function (edit, frame) {
            var info, duration,
                id = edit.id,
                i = edit.i,
                o = edit.o;
            
            if (o === Infinity) {
                info = ye.videoInfo[id];
                o = (info && info.duration) || 'end';
            }
            duration = o - i;

            if (!frame) {
                frame = YNcreate('<li class="dd frame"></li>');
            }
            frame.setContent(
                '<div class="time">' + 
                '<span class="from">' + convertTime(i)  + '</span>' +
                '<span class="to">' + convertTime(o) + '</span>' +
                '<span class="len">' + convertTime(duration) +'</span>' +
                '</div>' +
                '<img src="http://i.ytimg.com/vi/' + id + '/default.jpg">' +
                '<button class="del">X</button>'
            );

            return frame;
        },
        
        /** 
         * Build timeline frames when initializing.
         */
        buildTimeline = function () {
            arrayEach(edits, function (edit) {
                appendClip(edit, 1);
            });
        },

        /**
         * Update edits after drag and drop action.
         * @param {Node} frame The frame dropped.
         */
        moveClip = function (frame) {
            var clip, index,
                oldIndex = frame.getData('index'),
                prevFrame = frame.previous(),
                newIndex = (prevFrame && prevFrame.getData('index') + 1) || 0;

            // frame dropped from where?
            if (typeof oldIndex !== 'undefined') {
                // from timeline
                clip = edits.splice(oldIndex, 1)[0];
            } else {
                // from duration bar 
                clip = getCurrentClip();
                oldIndex = Infinity;
            }

            // frame moved from where to where?
            if (oldIndex > newIndex) {
                // from right to left
                index = newIndex;
            } else {
                // from left to right
                newIndex -= 1;
                frame = elTimeFrames.get('children').item(oldIndex);
                index = oldIndex;
            }

            insertClip(clip, newIndex);
            adjustFrameIndexes(frame, index);
            Y.log(['moveClip', oldIndex, newIndex, edits]);
        },
        
        // show search results callback
        showSearchResults = function (res, query, start) {
            Y.log(['parseVideoInfo', res]);
            var feed = res.feed,
                entries = feed && feed.entry;

            // clean on new searches
            if (start === 1) {
                elResults.all('li').remove(true);
                elSearchArea.removeClass('no-more');
            }

            // paginator controls
            lastQuery = query;
            lastStart = start;

            // check for more
            if ((start + 10) > INT(feed.openSearch$totalResults.$t)) {
                elSearchArea.addClass('no-more');
            }

            // get entries
            arrayEach(entries, function (entry, index) {
                var embeddable,
                    media = entry.media$group,
                    id = media.yt$videoid.$t,
                    desc = media.media$description.$t,
                    duration = INT(media.yt$duration.seconds),
                    title = entry.title.$t,
                    author = entry.author[0].name.$t,
                    pub = new Date(entry.published.$t),
                    views = INT(entry.yt$statistics.viewCount),
                    accesses = entry.yt$accessControl;

                // check if video is embeddable
                YArray.some(accesses, function (access) {
                    if (access.action === 'embed' &&
                            access.permission === 'allowed') {
                        embeddable = 1;
                        return 1;
                    }
                });
                if (!embeddable) {
                    return;
                }

                // fill results
                elResults.append(YNcreate('<li></li>')
                    .append(YNcreate('<a href="#" class="s-link"></a>')
                        .append(YNcreate('<img>')
                            .set('src',
                                'http://i' + ((index % 5) || '') +
                                '.ytimg.com/vi/' + id + '/default.jpg')
                        )
                        .append(YNcreate('<span class="s-title"></span>')
                            .setContent(title)
                        )
                        .append(YNcreate('<span class="s-views"></span>')
                            .setContent(views)
                        )
                        .append(YNcreate('<span class="s-pub"></span>')
                            .setContent(Y.toRelativeTime(pub))
                        )
                        .append(YNcreate('<span class="s-author"></span>')
                            .setContent(author)
                        )
                        .append(YNcreate('<span class="s-duration"></span>')
                            .setContent(convertTime(duration))
                        )
                        .setData('info', {
                            id: id,
                            title: title,
                            duration: duration
                        })
                    )
                );
            });
        },

        // fetch videos from gdata
        fetchVideos = function (query, start) {
            start = start || 1;
            Y.jsonp('http://gdata.youtube.com/feeds/api/videos?' +
                'v=2&alt=json-in-script&callback={callback}&max-results=10&' + 
                'q=' + ENCODE(query) + '&start-index=' + start, {
                    on: {
                        success: showSearchResults
                        // TODO: failure: searchError
                        // TODO: timeout: searchTimeout
                    },
                    args: [query, start]
                }
            );
        },

        /**
         * Search video submit form event.
         * @param {Event} e The submit event to be halt.
         * @param {String} query Optional search query, if ommited
         *        search input value is used instead.
         */
        submitSearch = function (e, query) {
            query = query || elSearch.get('value');

            if (e) {
                e.halt();
            }

            if (query && query !== lastQuery) {
                fetchVideos(query);
            }
        },

        // get more videos from last search
        moreVideos = function () {
            fetchVideos(lastQuery, lastStart + 10);
        },
        
        // init edit markup
        initMarkup = function () {
            // set edit mode
            body
                .removeClass('play')
                .addClass('edit');

            // fill edit controls
            elUrl = YNcreate('<input type="text">');
            elTimeFrames = YNcreate('<ul id="frames"></ul>');
            elClip = YNcreate('<li id="dts-clip" class="dd">foo</li>');
            elEditArea = YNcreate('<div id="edit-area"></div>')
                .append('<button id="add-edit">add</button><button id="refresh">refresh</button>')
                .append(
                    YNcreate('<div id="dts"><div id="dts-cb1" class="dts-cb">' +
                        '<div class="dts-vb"><div class="dts-sl">' +
                        '<div class="dts-arrow"></div></div></div></div>' +
                        '<div id="dts-cb2" class="dts-cb"><div class="dts-vb">' +
                        '<div class="dts-sl"><div class="dts-arrow"></div>' +
                        '</div></div></div></div>'
                    )
                        .append(
                            YNcreate('<div id="dts-rh"></div>')
                                .append(
                                    YNcreate('<ul id="clip-holder"></ul>')
                                        .append(elClip)
                                )
                        )
                )
                .append(
                    YNcreate('<div class="scroller">')
                        .append(
                            YNcreate('<div class="tl-wrapper"></div>')
                                .append(
                                    YNcreate('<div id="timeline"></div>')
                                        .append(elTimeFrames)
                                )
                        )
                )
                .append(elUrl)
                .append(
                    YNcreate('<button id="preview">preview</button>')
                );

            // fill search area
            elSearch = YNcreate(
                '<input id="search-txt" type="text" placeholder="Search" x-webkit-speech>');
            elResults = YNcreate('<ul id="results"></ul>');
            elSearchArea = YNcreate('<div id="search-area" class="no-more"></div>')
                .append(YNcreate('<div id="search-box"></div>')
                    .append(
                        YNcreate('<form id="search-frm"></form>')
                            .append(elSearch)
                            .append(
                                YNcreate('<input type="submit">')
                                    .setContent('Search')
                            )
                    )
                )
                .append(elResults)
                .append(YNcreate('<div></div>')
                    .append(YNcreate('<button id="more-btn"></button>')
                        .setContent('more')
                    )
                );

            // fill layout 
            Y.one('#st')
                .append(elEditArea);
            Y.one('#sb')
                .append(elSearchArea, 'after');

            // events delegation
            body.delegate('click', Ybind(appendClip), '#add-edit');
            body.delegate('dblclick', Ybind(appendClip), '#dts-clip');
            body.delegate('submit', submitSearch, '#search-frm');
            body.delegate('webkitspeechchange', submitSearch, '#search-txt');
            body.delegate('click', moreVideos, '#more-btn');
            body.delegate('click', preview, '#preview');
            body.delegate('click', removeClip, '#timeline .del');
            body.delegate('click', getVideo, '.s-link');
            // TODO: remove when done
            body.delegate('click', function(){dts.refresh();}, '#refresh');
        },

        /**
         * Initialize video position control dual thumb sliders.
         */
        initSliders = function () {
            Y.log(['dts duration', ye.duration]);
            var duration = ye.duration || 0;

            // dual thumb slider
            dts = new Y.DualThumbSlider({
                node: '#dts',
                highlight: '#dts-rh',
                    range: {
                        max: duration
                    }
            }).render();
            dts.on('valueChange', updatePos); 
            dts.on('thumbDragEnd', videoPos); 
            ye.ddFrame(elClip, elEditArea);
            elClip.setContent(convertTime(duration));
            ye.dts = dts;
        },
        
        /**
         * Initialize search auto complete.
         */
        initAutoComplete = function () {
            var ac;

            elSearch.plug(Y.Plugin.AutoComplete, {
                resultHighlighter: 'phraseMatch',
                resultListLocator: '1',
                maxResults: 8,
                source: 'http://suggestqueries.google.com/complete/search?hl=en&ds=yt&json=t&jsonp={callback}&q={query}'
            });
            ac = elSearch.ac;
            ac.after('query', function (e) {
                submitSearch(null, e.query);
            });
            ac.after('activeItemChange', function (e) {
                var value = e.newVal;

                if (value) {
                    submitSearch(null, value.getData('result').raw);
                }
            });
        };

    // listeners
    YGlobal.on('ye:videoChange', videoChange);
    multiscriber('ye:clipRemoved', [buildParams, function(e){Y.log(['clipRemoved', e]);}]);
    multiscriber('ye:clipAppended', [buildParams, function(e){Y.log(['clipAppended', e, arguments, 'edits', edits]);}]);
    multiscriber('ye:frameDropped', [moveClip, buildParams, function(e){Y.log(['editsUpdated', e]);}]);
    multiscriber('ye:paramsBuilt', [setUrlsParams, function(p){Y.log(['paramsBuilt', p]);}]);

    // expose api
    ye.getCurrentClip = getCurrentClip;
    ye.createFrame = createFrame;

    // initialize edit mode
    ye.edit = 1;
    ye.cancelPlayTimer();
    buildEdits();
    initMarkup();
    initSliders();
    initAutoComplete();
    buildParams();
    buildTimeline();
    ye.ddInit();
}, '0.0.1', {
    requires: ['youedit-play', 'event-delegate', 'youedit-edit-dd',
        'gallery-torelativetime', 'gallery-dualthumbslider', 'autocomplete',
        'autocomplete-highlighters'],
    use: ['youedit-edit-dd']
});
