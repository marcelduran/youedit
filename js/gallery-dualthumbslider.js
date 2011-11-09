YUI.add('gallery-dualthumbslider', function(Y) {
    var
    // minifier helpers
    YLisNumber = Y.Lang.isNumber,
        SimpleSlider = Y.apm.SimpleSlider,
        MATH = Math,
        ROUND = MATH.round,
        FALSE = false,
        TRUE = true,
        NULL = null,
        UNDEF = 'undefined',
        LEFT = 'left',
        WIDTH = 'width',
        ZINDEX = 'zIndex',
        OTHER = 'other',
        DRAGEND = 'drag:end',
        DRAGAFTERMD = 'drag:afterMouseDown',
        MOUSEDOWN = 'mousedown',
        VALUECHANGE = 'valueChange',
        VALUE = 'value',

        // wrapper for commonly used functions
        getStyle = function(node, prop, foo) {
            return parseInt(node.getStyle(prop), 10) || 0;
        },

        getLeft = function(node) {
            return getStyle(node, LEFT);
        },

        getWidth = function(node) {
            return getStyle(node, WIDTH);
        },

        getZindex = function(node) {
            return getStyle(node, ZINDEX);
        },

        // get node full width (margins + paddings + width)
        getBox = function(node) {
            return getStyle(node, 'marginLeft') + getStyle(node, 'borderLeftWidth') + getStyle(node, 'paddingLeft') + getWidth(node) + getStyle(node, 'paddingRight') + getStyle(node, 'borderRightWidth') + getStyle(node, 'marginRight');
        },

        DualThumbSlider = function(o) {
            var divs, rail1, rail2, slider1, slider2, sliderWidth, thumb1, thumb2, t1box, t2box, zindexRail1, zindexRail2, zindexMin, zindexMax, contentBox, highlight, that = this;

            DualThumbSlider.superclass.constructor.apply(that, arguments);

            // initial values
            contentBox = Y.one(o.node);
            highlight = Y.one(o.highlight);
            that.contentBox = contentBox;
            that.highlight = highlight;
            that.autoAdjust = o.autoAdjust || TRUE;
            that.focusClass = o.focusClass || 'focus';
            range = o.range;
            that.min = (range && range.min) || 0;
            that.max = (range && typeof range.max !== UNDEF ? range.max : 100);
            that.minValue = o.min || that.min;
            that.maxValue = o.max || that.max;

            // inner elements
            divs = contentBox.all('> div');
            rail1 = o.rail1 || divs.item(0);
            rail2 = o.rail2 || divs.item(1);
            that.rail1 = rail1;
            that.rail2 = rail2;

            // sliders
            slider1 = new SimpleSlider({
                node: rail1
            });
            slider2 = new SimpleSlider({
                node: rail2
            });
            sliderWidth = getWidth(contentBox);
            that.slider1 = slider1;
            that.slider2 = slider2;
            that.sliderWidth = sliderWidth;

            // thumbs and rails
            thumb1 = slider1.thumb;
            thumb2 = slider2.thumb;
            t1box = getBox(thumb1);
            t2box = getBox(thumb2);
            rail1.setStyle(LEFT, 0).setStyle(WIDTH, sliderWidth - t2box).setData(OTHER, rail2);
            rail2.setStyle('right', 0).setStyle(WIDTH, sliderWidth - t1box).setData(OTHER, rail1);
            thumb1.setStyle(LEFT, 0);
            thumb2.setStyle(LEFT, getWidth(rail2) - t2box);
            that.thumb1 = thumb1;
            that.thumb2 = thumb2;
            that.t1box = t1box;
            that.t2box = t2box;

            // z-indexes for focus
            zindexRail1 = getZindex(rail1);
            zindexRail2 = getZindex(rail2);
            zindexMax = MATH.max(zindexRail1, zindexRail2);
            zindexMin = MATH.min(zindexRail1, zindexRail2);
            if (zindexMax === zindexMin) {
                zindexMax += 1;
            }
            if (highlight && !getZindex(highlight)) {
                highlight.setStyle(ZINDEX, zindexMax + 1);
            }
            that.zindexMax = zindexMax;
            that.zindexMin = zindexMin;
        };

    Y.extend(DualThumbSlider, Y.Base, {
        render: function() {
            var slider1DD, slider2DD, that = this,
                slider1 = that.slider1,
                slider2 = that.slider2,
                rail1 = that.rail1,
                rail2 = that.rail2,
                adjustRail1 = that.adjustRail1,
                adjustRail2 = that.adjustRail2,
                railFocus = that.railFocus,
                valueChange = that.valueChange,
                thumbDragEnd = that.thumbDragEnd;

            // initial position
            slider1.render();
            slider2.render();
            slider1DD = slider1.dd;
            slider2DD = slider2.dd;

            that.ratio = (that.max - that.min) /
                (that.sliderWidth - that.t1box - that.t2box);
            that.setValues(that.minValue, that.maxValue);

            // events
            slider1DD.on(DRAGEND, thumbDragEnd, that, adjustRail1);
            slider2DD.on(DRAGEND, thumbDragEnd, that, adjustRail2);
            slider1DD.on(DRAGAFTERMD, railFocus, that, rail1);
            slider2DD.on(DRAGAFTERMD, railFocus, that, rail2);
            slider1.contentbox.on(MOUSEDOWN, adjustRail1, that, rail1);
            slider2.contentbox.on(MOUSEDOWN, adjustRail2, that, rail2);
            slider1.after(VALUECHANGE, valueChange, that);
            slider2.after(VALUECHANGE, valueChange, that);

            return that;
        },

        // fires when thumbs drag ends
        thumbDragEnd: function (e, railFn) {
            var value,
                that = this;

            railFn.call(that);
            value = that.get('value');
            value.changed = (railFn === that.adjustRail1 ? 'min' : 'max');

            that.fire('thumbDragEnd', value);        
        },

        // update rail highlight when available
        updateHighlight: function(thumb1Left, thumb2Left, rail2Width) {
            var that = this,
                t1box = that.t1box;

            thumb1Left = thumb1Left || getLeft(that.thumb1);
            thumb2Left = thumb2Left || getLeft(that.thumb2);
            rail2Width = rail2Width || getWidth(that.rail2);
            that.highlight.setStyle(LEFT, thumb1Left + t1box).setStyle(WIDTH, that.sliderWidth - rail2Width + thumb2Left - thumb1Left - t1box);
        },

        // set both min and max thumb values manually (function call) or automatically (mouse move)
        setValues: function(minVal, maxVal) {
            var thumb1Left, thumb2Left, rail2Width, value, that = this,
                min = that.min,
                ratio = that.ratio,
                highlight = that.highlight;

            if (!YLisNumber(minVal)) {
                thumb1Left = getLeft(that.thumb1);
                minVal = min + ROUND(thumb1Left * ratio);
            }
            if (!YLisNumber(maxVal)) {
                thumb2Left = getLeft(that.thumb2);
                rail2Width = getWidth(that.rail2);
                maxVal = min + ROUND((that.sliderWidth - that.t1box - rail2Width + thumb2Left) * ratio);
            }
            that.minValue = minVal;
            that.maxValue = maxVal;
            value = {
                min: minVal,
                max: maxVal
            };
            if (highlight) {
                that.updateHighlight(thumb1Left, thumb2Left, rail2Width);
                value.highlightWidth = getWidth(highlight);
            }
            that.set(VALUE, value);

            return this;
        },

        // wrapper for setting values for event listener
        valueChange: function() {
            return this.setValues();
        },

        // set focus on thumb 1 or 2 based on last changed
        railFocus: function(e, rail) {
            var that = this,
                focusClass = that.focusClass;

            rail.setStyle(ZINDEX, that.zindexMax).addClass(focusClass).getData(OTHER).setStyle(ZINDEX, that.zindexMin).removeClass(focusClass);
        },

        // adjust rail2 width and thumb2 position when thumb1 changes position
        adjustRail1: function(e, rail) {
            var that = this,
                t1box = that.t1box,
                thumb1Left = getLeft(that.thumb1),
                rail2Width = that.sliderWidth - thumb1Left - t1box;

            that.rail2.setStyle(WIDTH, rail2Width);
            that.thumb2.setStyle(LEFT, getWidth(that.rail1) - thumb1Left - t1box);
            if (that.highlight) {
                that.updateHighlight(thumb1Left, NULL, rail2Width);
            }
            if (rail) {
                that.railFocus.call(that, NULL, rail);
            }
        },

        // adjust rail1 width when thumb2 changes position
        adjustRail2: function(e, rail) {
            var that = this,
                thumb2Left = getLeft(that.thumb2),
                rail2Width = getWidth(that.rail2);

            that.rail1.setStyle(WIDTH, that.sliderWidth - rail2Width + thumb2Left);
            if (that.highlight) {
                that.updateHighlight(NULL, thumb2Left, rail2Width);
            }
            if (rail) {
                that.railFocus.call(that, NULL, rail);
            }
        },

        // update thumb value and position
        setThumb: function(thumb, x, values, adjustFunc) {
            var that = this;

            thumb.setStyle(LEFT, x);
            adjustFunc.call(that);

            return that.setValues(values[0], values[1]);
        },

        // calculate/adjust values for updating min thumb only
        updateMin: function(val) {
            var x, that = this,
                min = that.min,
                autoAdjust = that.autoAdjust,
                thumb1 = that.thumb1,
                t1box = that.t1box,
                invalidPos = val < min,
                setThumb = that.setThumb,
                adjustRail1 = that.adjustRail1;

            if (!YLisNumber(val) || (!autoAdjust && invalidPos)) {
                return FALSE;
            }

            x = ROUND((val - min) / that.ratio);
            if (!invalidPos && x < that.sliderWidth - t1box - getWidth(that.rail2) + getLeft(that.thumb2)) {
                return setThumb.call(that, thumb1, x, [val], adjustRail1);
            } else if (autoAdjust) {
                if (invalidPos) {
                    x = 0;
                    val = min;
                } else {
                    x = getWidth(that.rail1) - t1box;
                    val = that.maxValue;
                }
                return setThumb.call(that, thumb1, x, [val], adjustRail1);
            }
            return FALSE;
        },

        // calculate/adjust values for updating max thumb only
        updateMax: function(val) {
            var rail2Width, x, that = this,
                max = that.max,
                autoAdjust = that.autoAdjust,
                sliderWidth = that.sliderWidth,
                thumb2 = that.thumb2,
                invalidPos = val > max,
                setThumb = that.setThumb,
                adjustRail2 = that.adjustRail2;

            if (!YLisNumber(val) || (!autoAdjust && invalidPos)) {
                return FALSE;
            }

            rail2Width = getWidth(that.rail2);
            x = ROUND((val - that.min) / that.ratio) + that.t1box + rail2Width - sliderWidth;
            if (!invalidPos && sliderWidth - rail2Width + x > getLeft(that.thumb1)) {
                return setThumb.call(that, thumb2, x, [NULL, val], adjustRail2);
            } else if (autoAdjust) {
                if (invalidPos) {
                    x = rail2Width - that.t2box;
                    val = max;
                } else {
                    x = 0;
                    val = that.minValue;
                }
                return setThumb.call(that, thumb2, x, [NULL, val], adjustRail2);
            }
            return FALSE;
        },

        // wrapper for updating both min and max thumbs
        update: function(minVal, maxVal) {
            var that = this;

            if (that.updateMin(minVal)) {
                return that.updateMax(maxVal);
            }
        },

        // recalculate new slider boxes dimensions
        refresh: function() {
            var sliderWidth, that = this;

            sliderWidth = getWidth(that.contentBox);
            that.sliderWidth = sliderWidth;
            that.ratio = (that.max - that.min) / (sliderWidth - that.t1box - that.t2box);
            that.update(that.minValue, that.maxValue);
        }
    });

    DualThumbSlider.NAME = 'DualThumbSlider';
    DualThumbSlider.ATTRS = {
        value: {
            value: {
                min: 0,
                max: 100
            }
        },
        range: {
            setter: function (val) {
                var that = this;
                
                that.min = typeof val.min !== UNDEF ? val.min : that.min;
                that.max = typeof val.max !== UNDEF ? val.max : that.max;
                that.refresh();
            }
        }
    };

    Y.DualThumbSlider = DualThumbSlider;
}, '0.0.1', {
    requires: ['dd-constrain', 'node', 'gallery-center', 'gallery-simpleslider']
});
