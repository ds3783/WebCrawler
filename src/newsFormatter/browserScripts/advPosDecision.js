window.decideAdvPosition = function (htmls, options) {
    options = options || {
        tops: [229, 687],
        minGap: 1,
    };
    document.body.innerHTML = '<div id="test-zone"></div>';
    var zone = document.getElementById('test-zone');
    zone.innerHTML = '';
    var positions = [];
    var advIdx = 0, lastAdvIdx = -1;
    var lastAdvAtEnd = false;
    for (var i = 0; i < htmls.length; i++) {
        var paragrapth = htmls[i];
        zone.innerHTML += paragrapth.html;
        zone && zone.offsetTop;
        var height = zone.clientHeight;
        var expectMinHeight = options.tops[advIdx];
        if (!/class="placeholder-bottom"/.test(paragrapth.html)) {
            lastAdvAtEnd = false;
        }
        //168
        if (typeof expectMinHeight !== 'undefined' && height > expectMinHeight) {
            if (lastAdvIdx < 0 || i - lastAdvIdx > options.minGap) {
                if (paragrapth.json && paragrapth.json.type === 'PARAGRAPH') {
                    positions.push(i);
                    lastAdvIdx = i;
                    advIdx++;
                    lastAdvAtEnd = true;
                }
            }
        }
    }
    if (lastAdvAtEnd && positions.length > 0) {
        positions.pop();
    }
    return positions;
};