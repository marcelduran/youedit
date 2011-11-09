YUI.add('youedit-edit-search', function (Y) {
    Y.log('search loaded');
    var
        // variables
        lastQuery, lastStart, convertTime, getThumb,
        
        // uninitialized elements
        elSearch, elSearchArea, 

        // shorthands
        ye = Y.namespace('YouEdit'),
        YNcreate = Y.Node.create,
        YArray = Y.Array,
        arrayEach = YArray.each,
        nformat = Y.DataType.Number.format,

        // minifier helpers
        INT = function (s) {
            return parseInt(s, 10);
        },

        // initialized elements
        body = Y.one('body'),

        // show search results callback
        showSearchResults = function (res, query, start) {
            Y.log(['parseVideoInfo', res]);
            var feed = res.feed,
                entries = feed && feed.entry,
                escapeHtml = Y.Escape.html;

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
                var embeddable, shard,
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
                shard = (index % 5) || '';
                elResults.append(YNcreate('<li class="s-item"></li>')
                    .append(YNcreate('<a href="#" class="s-link" title="' + 
                        escapeHtml(title) + '"></a>')
                        .append(
                            YNcreate('<span class="s-clip">' +
                                '<img class="s-img" src="' +
                                getThumb(id, shard) + '">' +
                                '<span class="s-duration">' +
                                convertTime(duration) +
                                '</span></span>')
                        )
                        .append(YNcreate('<span class="s-title"></span>')
                            .setContent(title)
                        )
                        .append(YNcreate('<span class="s-author"></span>')
                            .setContent('by ' + author)
                        )
                        .append(YNcreate('<span class="s-views"></span>')
                            .setContent(nformat(views, {
                                    thousandsSeparator: ','
                                }) + ' views')
                        )
                        .append(YNcreate('<span class="s-pub"></span>')
                            .setContent(Y.toRelativeTime(pub))
                        )
                        .setData('info', {
                            id: id,
                            title: title,
                            duration: duration,
                            shard: shard
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
                'q=' + encodeURIComponent(query) + '&start-index=' + start, {
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
                elSearch.blur();
                elSearch.ac.once('resultsChange', function (e) {
                    e.halt();
                });
            }

            if (query && query !== lastQuery) {
                fetchVideos(query);
            }
        },

        // get more videos from last search
        moreVideos = function () {
            fetchVideos(lastQuery, lastStart + 10);
        },
        
        /**
         * Initialize search auto complete.
         */
        initAutoComplete = function () {
            var ac;

            elSearch.plug(Y.Plugin.AutoComplete, {
                queryDelay: 500,
                resultHighlighter: 'phraseMatch',
                resultListLocator: '1',
                maxResults: 8,
                source: 'http://suggestqueries.google.com/complete/search?hl=en&ds=yt&json=t&jsonp={callback}&q={query}'
            });
            ac = elSearch.ac;
            ac.after('query', function (e) {
                Y.log(['query', e]);
                submitSearch(null, e.query);
            });
            ac.after('activeItemChange', function (e) {
                Y.log(['activeItemChange', e]);
                var value = e.newVal;

                if (value) {
                    submitSearch(null, value.getData('result').raw);
                }
            });
        },
        
        /**
         * Initialize markup.
         */
        initMarkup = function () {
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

            Y.one('#sb').append(elSearchArea);
        };

    ye.searchInit = function () {
        Y.log('searchInit');
        convertTime = ye.convertTime;
        getThumb = ye.getThumb;
        initMarkup();
        initAutoComplete();
        body.delegate('submit', submitSearch, '#search-frm');
        body.delegate('webkitspeechchange', submitSearch, '#search-txt');
        body.delegate('click', moreVideos, '#more-btn');
    };
}, '0.0.1', {
    requires: ['gallery-torelativetime', 'autocomplete', 'escape',
        'autocomplete-highlighters', 'datatype-number-format']
});
