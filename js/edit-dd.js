YUI.add('youedit-edit-dd', function (Y) {
    var goingUp, lastX, dts,
    
        // elements
        elFrames, elClipHolder,

        // shorthands
        ye = Y.namespace('YouEdit'),
        YDD = Y.DD,
        YDDM = Y.DD.DDM,
        YPlugin = Y.Plugin,
        YGlobal = Y.Global,

        // make frame (li) draggable
        ddFrame = function (node, region) {
            var dd = new YDD.Drag({
                node: node,
                target: {
                    padding: '0 0 0 20'
                }
            }).plug(YPlugin.DDProxy, {
                moveOnEnd: false
            }).plug(YPlugin.DDConstrained, {
                constrain2node: region || '#timeline'
            }).plug(YPlugin.DDNodeScroll, {
                node: '#timeline ul'
            });
        };

    Y.log('edit dd loaded');

    YDDM.on('drop:over', function (e) {
        var drop, tag,
            drag = e.drag.get('node');

        // only for dd frames
        if (!drag.hasClass('dd')) {
            return;
        }
        
        drop = e.drop.get('node');
        //Y.log(['drop:over', e]);
        tag = drop.get('tagName').toLowerCase();
        if (tag === 'li') {
            if (!goingUp) {
                drop = drop.get('nextSibling');
            }
            elFrames.insertBefore(drag, drop);
            e.drop.sizeShim();
        } else if (tag === 'ul' && drag.get('parentNode') === elClipHolder) {
            elFrames.append(drag);
        }
    });

    // listen for all drag:drag events
    YDDM.on('drag:drag', function (e) {
        var x,
            drag = e.target;

        // only for dd frames
        if (!drag.get('node').hasClass('dd')) {
            return;
        }
        //Y.log(['drag:drag', e]);
        
        // get the last x point
        x = drag.lastXY[0];
        // is it greater than the lastX var?
        goingUp = x < lastX;
        lastX = x;
        YDDM.syncActiveShims(true);
    });

    // listen for all drag:start events
    YDDM.on('drag:start', function (e) {
        //Get our drag object
        var dragNode,
            drag = e.target,
            node = drag.get('node');

        // only for dd frames
        if (!node.hasClass('dd')) {
            return;
        }
        Y.log(['drag:start', e, drag.startXY[0], drag.nodeXY[0]]);

        dragNode = drag.get('dragNode');
        // duration bar
        if (node.get('id') === 'dts-clip') {
            node
                .setData('original', node.getContent())
                .addClass('clip-drag frame');
            ye.createFrame(ye.getCurrentClip(), node);
            dragNode
                .setContent(node.getContent())
                .addClass('clip-drag frame');
            return;
        }

        // set some styles here
        dragNode
            .setContent(node.getContent())
            .setStyle('opacity', '.7');
        node.setStyle('opacity', '.25');
    });

    // listen for a drag:end events
    YDDM.on('drag:end', function (e) {
        var drag = e.target.get('node');

        // only for dd frames
        if (!drag.hasClass('dd')) {
            return;
        }
        Y.log(['drag:end', e, drag]);

        if (drag.get('id') === 'dts-clip') {
            Y.log('clip drag end');
            drag
                .setContent(drag.getData('original'))
                .removeClass('clip-drag').removeClass('frame');
            elClipHolder.append(drag);

            return;
        }
        // put our styles back
        drag.setStyles({
            visibility: '',
            opacity: '1'
        });
    });

    YDDM.on('drag:dropmiss', function (e) {
        Y.log(['drag:dropmiss', e]);
    });

    // listen for all drag:drophit events
    YDDM.on('drag:drophit', function (e) {
        var drop, cloneNode,
            drag = e.drag.get('node');

        // only for dd frames
        if (!drag.hasClass('dd')) {
            return;
        }

        drop = e.drop.get('node');
        Y.log(['drag:drophit', e]);

        // frame dropped from where?
        if (drag.get('id') === 'dts-clip') {
            // from duratino bar
            Y.log('clip dropped');
            cloneNode = drag.cloneNode(true);
            cloneNode
                .set('id', Y.guid())
                .removeClass('yui3-dd-drop-over')
                .removeClass('yui3-dd-dragging')
                .removeClass('clip-drag');
            ddFrame(cloneNode);
            elFrames.insertBefore(cloneNode, drag);
        } else if (drop.get('tagName').toLowerCase() !== 'li') {
            // from timeline
            if (!drop.contains(drag)) {
                drop.appendChild(drag);
                // set the new parentScroll on the nodescroll plugin
                e.drag.nodescroll.set('parentScroll', e.drop.get('node'));                
            }
        }
        YGlobal.fire('ye:frameDropped', cloneNode || drag);
    });

    // initialize drag and drop timeline
    ye.ddInit = function () {
        var tar = new YDD.Drop({
                node: Y.one('#timeline ul')
            });
        
        elFrames = Y.one('#frames');
        elClipHolder = Y.one('#clip-holder');
        dts = ye.dts;
    };

    // expose api
    ye.ddFrame = ddFrame;
}, '0.0.1', {
    requires: ['dd-constrain', 'dd-proxy', 'dd-drop',
        'dd-scroll']
});
