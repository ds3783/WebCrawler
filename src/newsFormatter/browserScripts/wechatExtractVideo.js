(function () {
    window.__N_VIDEO_RESULT = {};
    var i;
    if (!window.frameElement) {
        return;
    }
    var vid = '';
    try {
        vid = window.frameElement.getAttribute('data-mpvid');
    } catch (e) {
    }
    if (!vid) {
        try {
            var match = location.search.match(/vid=(\w+)&/);
            if (match) {
                vid = match[1] || '';
            }
        } catch (e) {
        }
    }

    if (!vid) {
        return;
    }
    window.__N_VIDEO_RESULT.vid = vid;
    var vidoes = document.getElementsByTagName('video');
    for (i = 0; i < vidoes.length; i++) {
        var src = vidoes[i].getAttribute('src') || vidoes[i].getAttribute('origin_src') || '';
        if (src) {
            window.__N_VIDEO_RESULT.src = src;
        }
        var cover = document.getElementsByClassName('txp_poster')[0] || document.getElementsByClassName('poster_cover')[0] || null;
        if (cover) {
            cover = cover.getAttribute('style');
            var coverMatches = cover.match(/url\("(.*)"\)/);
            if (coverMatches && coverMatches.length > 1) {
                cover = coverMatches[1];
                if (/^\/\//.test(cover)) {
                    cover = location.protocol + cover;
                }
                window.__N_VIDEO_RESULT.cover_image = {url: cover};
            }

        }
    }
    console.log('get video', window.__N_VIDEO_RESULT);
})();