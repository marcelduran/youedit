YUI.add('youedit-edit-dd', function (Y) {
    var goingUp, lastX,

        // shorthands
        ye = Y.namespace('YouEdit'),
        YDD = Y.DD,
        YDDM = Y.DD.DDM,
        YPlugin = Y.Plugin,
        YGlobal = Y.Global;

    Y.log('edit dd loaded');

    YDDM.on('drop:over', function (e) {
        // get a reference to our drag and drop nodes
        var drag = e.drag.get('node'),
            drop = e.drop.get('node');
        
        // are we dropping on a li node?
        if (drop.get('tagName').toLowerCase() === 'li') {
            // are we not going up?
            if (!goingUp) {
                drop = drop.get('nextSibling');
            }
            // add the node to this list
            e.drop.get('node').get('parentNode').insertBefore(drag, drop);
            // set the new parentScroll on the nodescroll plugin
            e.drag.nodescroll.set('parentScroll', e.drop.get('node').get('parentNode'));            
            // resize this nodes shim, so we can drop on it later.
            e.drop.sizeShim();
        }
    });

    // listen for all drag:drag events
    YDDM.on('drag:drag', function (e) {
        var x = e.target.lastXY[0]; // get the last x point

        // is it greater than the lastX var?
        goingUp = x < lastX;
        lastX = x;
        YDDM.syncActiveShims(true);
    });

    // listen for all drag:start events
    YDDM.on('drag:start', function (e) {
        //Get our drag object
        var drag = e.target;
        // set some styles here
        drag.get('node').setStyle('opacity', '.25');
        drag.get('dragNode').set('innerHTML', drag.get('node').get('innerHTML'));
        drag.get('dragNode').setStyles({
            opacity: '.5',
            borderColor: drag.get('node').getStyle('borderColor'),
            backgroundColor: drag.get('node').getStyle('backgroundColor')
        });
    });

    // listen for a drag:end events
    YDDM.on('drag:end', function (e) {
        // put our styles back
        e.target.get('node').setStyles({
            visibility: '',
            opacity: '1'
        });
        YGlobal.fire('ye:timelineUpdate');
    });

    // listen for all drag:drophit events
    YDDM.on('drag:drophit', function (e) {
        var drop = e.drop.get('node'),
            drag = e.drag.get('node');

        //if we are not on an li, we must have been dropped on a ul
        if (drop.get('tagName').toLowerCase() !== 'li') {
            if (!drop.contains(drag)) {
                drop.appendChild(drag);
                // set the new parentScroll on the nodescroll plugin
                e.drag.nodescroll.set('parentScroll', e.drop.get('node'));                
            }
        }
    });
    
    // make frame (li) draggable
    ye.ddFrame = function (li) {
        var dd = new YDD.Drag({
            node: li,
            target: {
                padding: '0 0 0 20'
            }
        }).plug(YPlugin.DDProxy, {
            moveOnEnd: false
        }).plug(YPlugin.DDConstrained, {
            constrain2node: '#timeline'
        }).plug(YPlugin.DDNodeScroll, {
            node: li.get('parentNode')
        });
    };

    // initialize drag and drop timeline
    ye.ddInit = function () {
        var tar = new YDD.Drop({
            node: Y.one('#timeline ul')
        });
    };
}, '0.0.1', {
    requires: ['dd-constrain', 'dd-proxy', 'dd-drop', 'dd-scroll']
});
