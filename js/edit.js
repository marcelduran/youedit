YUI.add('youedit-edit', function (Y) {
    Y.log('edit loaded');
    var 
        // const
        SLIDER_THUMB = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAABICAMAAAAeVV+sAAADAFBMVEWMjY/4+PjQ0dLf4OHu7u/19fXj4+Tx8vLq6uvn5+i0tLTc3d77+/vZ2tvGx8jm5+ednZ39/f3W19e4urz///+trrC3uLu/wMH5+fnz8/Po6enCw8RycnIVFRUYGBijpafP0NHY2dqvsLHt7u7w8PHv8PC1t7r39/d4eHiur7Dc3N3Z2trZ2drf4ODT09Tt7e3d3d719vaUlJbk5OW0tbbc3d3x8fLr6+zX19fS09STlJbk5OTm5ufg4eH6+vqSk5X8/Px1dXX4+fnMzc7p6urV1teVlpjKy8zs7e0AAAD///9LS0tMTExNTU1OTk5PT09QUFBRUVFSUlJTU1NUVFRVVVVWVlZXV1dYWFhZWVlaWlpbW1tcXFxdXV1eXl5fX19gYGBhYWFiYmJjY2NkZGRlZWVmZmZnZ2doaGhpaWlqampra2tsbGxtbW1ubm5vb29wcHBxcXFycnJzc3N0dHR1dXV2dnZ3d3d4eHh5eXl6enp7e3t8fHx9fX1+fn5/f3+AgICBgYGCgoKDg4OEhISFhYWGhoaHh4eIiIiJiYmKioqLi4uMjIyNjY2Ojo6Pj4+QkJCRkZGSkpKTk5OUlJSVlZWWlpaXl5eYmJiZmZmampqbm5ucnJydnZ2enp6fn5+goKChoaGioqKjo6OkpKSlpaWmpqanp6eoqKipqamqqqqrq6usrKytra2urq6vr6+wsLCxsbGysrKzs7O0tLS1tbW2tra3t7e4uLi5ubm6urq7u7u8vLy9vb2+vr6/v7/AwMDBwcHCwsLDw8PExMTFxcXGxsbHx8fIyMjJycnKysrLy8vMzMzNzc3Ozs7Pz8/Q0NDR0dHS0tLT09PU1NTV1dXW1tbX19fY2NjZ2dna2trb29vc3Nzd3d3e3t7f39/g4ODh4eHi4uLj4+Pk5OTl5eXm5ubn5+fo6Ojp6enq6urr6+vs7Ozt7e3u7u7v7+/w8PDx8fHy8vLz8/P09PT19fX29vb39/f4+Pj5+fn6+vr7+/v8/Pz9/f3+/v7///8BB5tZAAAAS3RSTlP//////////////////////////////////////////////////////////////////////////////////////////////////wDLGfCsAAAAzElEQVQ4y93R6WLBQBSG4UMEE2uTTEISSxeqtta+64Iy7v+COjNHmN4B3n/P9/eD4//gJk0qmmpi2ZZ2MadtW2Zo4jyIHBNNnDRGxQCkHgmjI266jujY+4Jyw08vgW1XIPxajGHkQ1p/SWLxtnTxOYd1TOnxJI41u9I1T8Meq9KxZQrbbaQPgww22wv/etEw/5Pbb7lZzB0+cX+5fcDmb9Nb/fP+bLC8aoMxHOBMHOBCOYBCMYBKxgxupnYFLikscTcUf3MXgvJJ5aDwB9opBevJ8yMUAAAAAElFTkSuQmCC',

        // shorthands
        ye = Y.namespace('YouEdit'),
        win = Y.config.win,
        YNcreate = Y.Node.create,
        YArray = Y.Array,
        arrayEach = YArray.each,
        video = ye.video,
        YGlobal = Y.Global,

        // elements
        elVid, elFrom, elTo, elLen, elSec, elUrl, elTimeFrames, elControls,
        fromSlider, toSlider,

        // variables
        edits, ctrlsW, ctrlsX,

        // convert s in m:s
        convertTime = function (s) {
            var h, m, ss, hour, min;

            if (isNaN(s) || elSec.get('checked')) {
                return s;
            }

            h = parseInt(s / 3600, 10);
            m = parseInt((s % 3600) / 60, 10);
            ss = s - (m * 60) - (h * 3600);
            hour = s >= 3600;
            min = s >= 60;

            return (hour ? (h < 10 ? '0' : '') + h + ':' : '') +
                (min ? (m < 10 && hour ? '0' : '') + m + ':' : '') +
                (!min ? '0:' : '') +
                (ss < 10 ? '0' : '') + ss;
        },
        
        // build params from marks
        buildParams = function () {
            var id, hid, marks, s, f, lastF, lastT,
                ids = {},
                v = [],
                S = [],
                F = [],
                debug = ye.debug,
                radix = debug ? 10 : 36;

            arrayEach(edits, function (edit, i) {
                // hash of unique ids
                id = edit.id;
                hid = ids[id];
                if (hid > -1) {
                    v.push(hid);
                } else {
                    v.push(id);
                    ids[id] = i;
                }

                // get s(tart) and f(inish) marks
                marks = edit.marks;
                s = [];
                f = [];
                lastF = lastT = null;
                arrayEach(marks, function (mark, j) {
                    var val = mark.f;

                    // ommit value for begin and end of video length
                    s.push(!val ? null : val === lastF ? '-' :
                        val.toString(radix));
                    lastF = val;
                    val = mark.t;
                    f.push(val === Infinity ? null : val === lastT ? '-' :
                        val.toString(radix));
                    lastT = val;
                });
                S.push(s.join());
                F.push(f.join());
            });

            YGlobal.fire('ye:paramsBuilt',
                (!v.length && !S.length && !F.length) ? '' :
                'v=' + v.join() + '&s=' + S.join('|') + '&f=' + F.join('|') +
                (debug ? ('&d=' + debug) : '')
            );
        },

        // build marks from params
        buildMarks = function () {
            var len, marks, ps, pf,
                edits = [],
                params = ye.getParams();

            if (params) {
                // loop through video ids and marks
                arrayEach(params.v, function (vid, i) {
                    len = edits.length;
                    edits[len] = {id: vid, marks: []};
                    marks = edits[len].marks;
                    ps = params.s[i];
                    pf = params.f[i];
                    arrayEach(ps, function (s, j) {
                        marks.push({
                            f: s || 0,
                            t: pf[j] || Infinity
                        });
                    });
                });
            }

            Y.log(['buildMarks', edits]);
            return edits;
        },
        
        // set preview url and location hash with editing params
        setUrlsParams = function (params) {
            var loc = win.location,
                search = loc.search,
                idx = search.lastIndexOf('/');

            idx = idx > -1 ? idx : search.length;
            Y.log(['setUrls', params, search.slice(1, idx)]);
            if (!params || params === search.slice(1, idx)) {
                return;
            }

            elUrl.set('value', loc.protocol + '//' + loc.host +
                loc.pathname + '?' + params);
            loc.hash = params;
        },

        // add edit
        addMark = function () {
            var edit, id, mark, marks,
                len = edits.length,
                f = elFrom.getData('t'),
                t = elTo.getData('t');

            if (t < f) {
                // TODO: warning here
                Y.log(['addMark', 'invalid range']);
                return;
            }

            // get current id
            edit = edits[len - 1];
            id = ye.id || (edit && edit.id);

            if (!id) {
                Y.log(['addMark', 'id not found']);
                return;
            }

            // push mark
            if (!edit || edit.id !== id) {
                edits[len] = {id: id, marks: []};
                edit = edits[len];
            }
            mark = {
                f: f,
                t: t === ye.duration ? Infinity : t
            };
            marks = edit.marks;
            marks.push(mark);

            YGlobal.fire('ye:markAdded', edit, mark, marks.length - 1);
        },

        // get new video
        getVideo = function () {
            var id = ye.parseVideoId(elVid.get('value'));
            Y.log('get video: ' + id);

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
            Y.log(info);

            elVid.set('value', info.id);
            fromSlider.setValue(0);
            fromSlider.set('max', duration);
            toSlider.set('max', duration);
            toSlider.setValue(duration);
        },

        // set marks
        setMark = function (mark, value) {
            mark
                .set('value', convertTime(value))
                .setData('t', value);

            elLen.set('value', convertTime(
                elTo.getData('t') - elFrom.getData('t')
            ));
        },

        // update input controls position
        setControlsPos = function (from, x) {
            if (from) {
                // from changed
                ctrlsW -= x - ctrlsX;
                ctrlsX = x;
                elControls
                    .setStyle('left', x)
                    .setStyle('width', ctrlsW);
            } else {
                // to changed
                ctrlsW = x - ctrlsX;
                elControls.setStyle('width', ctrlsW);
            }
        },
        
        // update video/inputs on slider changes
        updateSlider = function (e, otherSlider, gte) {
            var newVal = e.newVal,
                otherValue = otherSlider.getValue(),
                target = e.target;

            setControlsPos(gte, target.thumb.getX());

            // update new value on inputs and video pos
            if ((gte && newVal >= otherValue) ||
                (!gte && newVal <= otherValue)) {
                target.setValue(e.prevVal);
            } else {
                ye.current = newVal;
                setMark(this, newVal);
                video.callSWF('seekTo', [newVal, false]);
                video.callSWF('pauseVideo');
            }
        },

        // update video on slide ends
        slideEnd = function (e) {
            video.callSWF('seekTo', [ye.current, true]);
            video.callSWF('pauseVideo');
        },
        
        // set time in seconds
        setSeconds = function (e) {
            setMark(elFrom, elFrom.getData('t'));
            setMark(elTo, elTo.getData('t'));
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
        
        // add new frame to timeline
        addTimeline = function (edit, mark, index) {
            var info, len,
                frame = YNcreate('<li></li>'),
                id = edit.id,
                from = mark.f,
                to = mark.t;
            
            if (to === Infinity) {
                info = ye.videoInfo[id];
                to = (info && info.duration) || 'end';
            }
            len = to - from;
            Y.log(['addTimeline', edit, mark, index]);
            frame
                .setData('mark', {edit: edit, mark: mark, index: index})
                .append(YNcreate('<div class="time"></div>')
                    .append(YNcreate('<span class="from"></span>')
                        .setContent(convertTime(from)))
                    .append(YNcreate('<span class="to"></span>')
                        .setContent(convertTime(to)))
                    .append(YNcreate('<span class="len"></span>')
                        .setContent(convertTime(len)))
                )
                .append(YNcreate('<img/>').set('src',
                    'http://i.ytimg.com/vi/' + id + '/default.jpg'))
                .append(YNcreate('<button class="del">X</button>'));

            elTimeFrames.append(frame);
            ye.ddFrame(frame);
        },

        // build timeline
        buildTimeline = function () {
            arrayEach(edits, function (edit) {
                arrayEach(edit.marks, function (mark, index) {
                    addTimeline(edit, mark, index);
                });
            });
        },
        
        // update edits from timeline
        updateEdits = function () {
            var lastId, marks,
                newEdits = [];

            elTimeFrames.all('li').each(function (frame) {
                var mark = frame.getData('mark'),
                    id = mark.edit.id;

                if (lastId !== id) {
                    lastId = id;
                    marks = [mark.mark];
                    newEdits.push({id: id, marks: marks});
                } else {
                    marks.push(mark.mark);
                }
            });

            edits = newEdits;
            YGlobal.fire('ye:editsUpdated', edits);
        },
        
        // delete mark from timeline
        deleteMark = function (e) {
            var node = e.target.ancestor('li'),
                mark = node.getData('mark'),
                edit = mark.edit;

            edit.marks.splice(mark.index, 1);
            node.remove();
            YGlobal.fire('ye:markDeleted', mark, edit);
        },
        
        // init edit markup
        initMarkup = function () {
            var elEditArea, areaWidth;

            // set edit mode and insert edit area
            Y.one('body').addClass('edit-mode');

            // fill edit controls
            elVid = YNcreate('<input type="text">')
                .set('value', ye.id || '');
            elFrom = YNcreate('<input type="text">');
            elTo = YNcreate('<input type="text">');
            elLen = YNcreate('<input type="text">');
            elSec = YNcreate('<input type="checkbox" unchecked>')
                .set('id', 'seconds');
            elUrl = YNcreate('<input type="text">');
            elTimeFrames = YNcreate('<ul></ul>');
            elControls = YNcreate('<div></div>')
                .addClass('wcontrols')
                .append(
                    YNcreate('<div></div>')
                        .addClass('controls')
                        .append(
                            YNcreate('<div></div>')
                                .addClass('time from')
                                .append(
                                    YNcreate('<label></label>')
                                        .setContent('from')
                                )
                                .append(elFrom)
                        )
                        .append(
                            YNcreate('<div></div>')
                                .addClass('wadd')
                                .append(
                                    YNcreate('<span></span>')
                                        .addClass('time add')
                                        .append(
                                            YNcreate('<label></label>')
                                                .setContent('length')
                                        )
                                        .append(elLen)
                                        .append(
                                            YNcreate('<button></button>')
                                                .set('id', 'add-edit')
                                                .setContent('add')
                                        )
                                )
                        )
                        .append(
                            YNcreate('<div></div>')
                                .addClass('time to')
                                .append(
                                    YNcreate('<label></label>')
                                        .setContent('to')
                                )
                                .append(elTo)
                        )
                );
            elEditArea = YNcreate('<div></div>')
                .set('id', 'edit-area')
                .append(YNcreate('<div></div>')
                    .append(elVid)
                    .append(
                        YNcreate('<button></button>')
                            .set('id', 'get-video')
                            .addClass('action')
                            .setContent('get video')
                    )
                    .append(elSec)
                )
                .append(
                    YNcreate('<div></div>')
                        .addClass('markinput')
                        .append(elControls)
                )
                .append(
                    YNcreate('<div id="slider-from"></div><div id="slider-to"></div>')
                )
                .append(
                    YNcreate('<div class="tl-wrapper"></div>')
                        .append(
                            YNcreate('<div id="timeline"></div>').append(elTimeFrames)
                        )
                )
                .append(elUrl)
                .append(
                    YNcreate('<button id="preview">preview</button>')
                );
            Y.one('#video').insert(elEditArea, 'after');
            areaWidth = elEditArea.getComputedStyle('width');

            // events
            elEditArea.delegate('click', addMark, '#add-edit');
            elEditArea.delegate('click', getVideo, '#get-video');
            elEditArea.delegate('click', setSeconds, '#seconds');
            elEditArea.delegate('click', preview, '#preview');
            elEditArea.delegate('click', deleteMark, '#timeline .del');

            // sliders
            fromSlider = new Y.Slider({
                length: areaWidth,
                min: 0,
                max: ye.duration || 100,
                value: ye.current || 0,
                clickableRail: false,
                thumbUrl: SLIDER_THUMB
            });
            toSlider = new Y.Slider({
                length: areaWidth,
                min: 0,
                max: ye.duration || 100,
                value: ye.duration || 100,
                clickableRail: false,
                thumbUrl: SLIDER_THUMB
            });
            elFrom.setData('slider', fromSlider);
            //elFrom.on('keyup', updateSlider, elFrom, toSlider, true);
            fromSlider.after('valueChange', updateSlider, elFrom, toSlider,
                true);
            fromSlider.on('slideEnd', slideEnd);
            fromSlider.render('#slider-from');
            elTo.setData('slider', toSlider);
            //elTo.on('keyup', updateSlider);
            toSlider.after('valueChange', updateSlider, elTo, fromSlider,
                false);
            toSlider.on('slideEnd', slideEnd);
            toSlider.render('#slider-to');
            
            setMark(elFrom, ye.current || 0);
            setMark(elTo, ye.duration || 300);
            ctrlsX = 0;
            setControlsPos(false, toSlider.thumb.getX());
            setControlsPos(true, fromSlider.thumb.getX());
        };

    // listeners
    YGlobal.on('ye:videoChange', videoChange);
    YGlobal.on('ye:timelineUpdate', updateEdits);
    multiscriber('ye:markDeleted', [buildParams, function(m, e){Y.log(['markDeleted', m, e]);}]);
    multiscriber('ye:markAdded', [buildParams, addTimeline, function(e, m, i){Y.log(['markAdded', e, m, i]);Y.log(['edits', edits]);}]);
    multiscriber('ye:paramsBuilt', [setUrlsParams, function(p){Y.log(['paramsBuilt', p]);}]);
    multiscriber('ye:editsUpdated', [buildParams, function(e){Y.log(['editsUpdated', e]);}]);

    // initialize edit mode
    ye.cancelPlayTimer();
    edits = buildMarks();
    initMarkup();
    buildParams();
    buildTimeline();
    ye.ddInit();
}, '0.0.1', {
    requires: ['youedit-play', 'event-delegate', 'slider', 'youedit-edit-dd'],
    use: ['youedit-edit-dd']
});
