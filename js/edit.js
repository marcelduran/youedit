YUI.add('youedit-edit', function (Y) {
    Y.log('edit loaded');
    var 
        // variables
        dts, currentVKey, maxFrames,

        // uninitialized elements
        elUrl, elTimeFrames, elGalFrames,
        elResults, elClip, elEditArea,

        // initialized variables
        edits = [],

        // regular expresions
        // matches 01:15:33 | 3:25 | 43
        reHMS = /(\d{0,2}):?(\d{0,2}):?(\d{0,2})/,

        // constants
        FRAME_WIDTH = 126,

        // shorthands
        ye = Y.namespace('YouEdit'),
        win = Y.config.win,
        YNcreate = Y.Node.create,
        YArray = Y.Array,
        arrayEach = YArray.each,
        YLang = Y.Lang,
        isString = YLang.isString,
        isUndefined = YLang.isUndefined,
        video = ye.video,
        YGlobal = Y.Global,
        Ybind = Y.bind,
        base10To64 = ye.base10To64,
        videoInfo = ye.videoInfo,

        // minifier helpers
        INT = function (s) {
            return parseInt(s, 10);
        },

        // initialized elements
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
                m = reHMS.exec(h);
            
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
         * Get Youtube video thumbnail.
         * @param {String} id The YT video ID.
         * @param {Number} shard Optional YT sharding
         *        server number ('' | 1-4), default = ''.
         * @param {Number} pos Optional thumb video position
         *        (default|1-3), default = 'default'.
         * @return {String} The YT thumbnail url.
         */
        getThumb = function (id, shard, pos) {
            var vi;

            if (isUndefined(shard)) {
                vi = videoInfo[id];
                shard = (vi && vi.shard) || '';
            }
            pos = pos || 'default';

            return 'http://i' + shard + '.ytimg.com/vi/' +
                id + '/' + pos + '.jpg';
        },

        /**
         * Update gallery of used videos in edition.
         * @param {Array} videos List of unique video ids being used in edition.
         * @param {String} vkey Hash of videos being used (for comparison).
         */
        updateGallery = function (videos, vkey) {
            if (currentVKey === vkey) {
                return;
            }
            currentVKey = vkey;
            elGalFrames.all('li').remove(true);
            if (!vkey) {
                return;
            }
            arrayEach(videos, function (id) {
                var info;

                if (!isString(id)) {
                    return;
                }

                info = videoInfo[id];
                elGalFrames.append(
                    YNcreate('<li></li>')
                        .append(
                            YNcreate('<a href="#" class="s-link"><img ' +
                                'src="' + getThumb(id, info.shard) + '"></a>'
                            )
                            .setData('info', info)
                        )
                );
            });
        },

        /** 
         * Build parameters from edits
         */
        buildParams = function () {
            var id, hid, marks, i, o, lastI, lastO, vkey,
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

            // update gallery of unique videos used in edition
            vkey = v.join('.');
            updateGallery(v, vkey);

            YGlobal.fire('ye:paramsBuilt', 
                (!v.length && !I.length && !O.length) ? '' :
                    'v=' + vkey + '&i=' + I.join('!') + '&o=' + O.join('!')
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
            if (!isUndefined(index)) {
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
         * @param {Object} clip Clip to be appended.
         * @param {Number} index The clips index of appended clip.
         */
        appendClip = function (clip, index) {
            var frame = createFrame(clip);

            frame.setData('index', index);
            elTimeFrames.append(frame);
            ye.ddFrame(frame);
        },

        /**
         * Append clip from the current selection. Event fired by UI controls.
         */
        appendSelection = function () {
            var clip = getCurrentClip();

            appendClip(clip, insertClip(clip));
            YGlobal.fire('ye:clipAppended', clip);
        },

        // get new video
        getVideo = function (ev) {
            var info = ev.currentTarget.getData('info'),
                id = info.id;

            Y.log('get video: ' + id);
            ev.preventDefault();

            if (!id) {
                return;
            }

            ye.id = id;
            ye.loadVideo(info);
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
            var duration,
                id = edit.id,
                i = edit.i,
                o = edit.o,
                info = videoInfo[id];
            
            if (o === Infinity) {
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
                '<img src="' + getThumb(id, info.shard) + '">' +
                '<button class="del">X</button>'
            );

            return frame;
        },
        
        /** 
         * Build timeline frames when initializing.
         */
        buildTimeline = function () {
            arrayEach(edits, function (edit, index) {
                appendClip(edit, index);
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
            if (!isUndefined(oldIndex)) {
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
        
        // init edit markup
        initMarkup = function () {
            var elGallery;

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

            // fill video gallery
            elGalFrames = YNcreate('<ul id="gallery"></ul>');
            elGallery = YNcreate('<div></div>')
                .append(elGalFrames);

            // fill layout 
            Y.one('#st')
                .append(elEditArea);
            Y.one('#md')
                .append(elGallery);

            // get timeline width
            maxFrames = INT(elTimeFrames.getStyle('width') / FRAME_WIDTH);

            // events delegation
            body.delegate('click', appendSelection, '#add-edit');
            body.delegate('dblclick', appendSelection, '#dts-clip');
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
            ye.ddFrame(elClip, true);//elEditArea);
            elClip.setContent(convertTime(duration));
            ye.dts = dts;
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
    ye.convertTime = convertTime;
    ye.getThumb = getThumb;

    // initialize edit mode
    ye.edit = 1;
    ye.cancelPlayTimer();
    buildEdits();
    initMarkup();
    initSliders();
    // although params is already set for edition, call buildParams again to
    // get the shortest and cleanest version, i.e.: without hash (when present)
    buildParams();
    buildTimeline();
    ye.ddInit();
    ye.searchInit();
}, '0.0.1', {
    requires: ['youedit-play', 'event-delegate', 'youedit-edit-dd',
        'gallery-dualthumbslider', 'youedit-edit-search'],
    use: ['youedit-edit-dd', 'youedit-edit-search']
});
