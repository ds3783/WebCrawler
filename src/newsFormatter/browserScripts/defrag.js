var RESULT_PROP_NAME = '__NESTIA_DEFRAG_RESULT__';
var DEFRAG_ELEMENT_ID = '__NESTIA_DEFRAG_ID__';
var LOADING_QUEUE = '__NESTIA_LOADING_QUEUE__';


var defaultSectionDemo = {
    type: 'PARAGRAPH|H2|H6|IMG|CARD|PROMO-BUTTON|YOUTUBE-VIDEO|VIDEO|LINK-1|ADV-1',
    url: '', //for img , button ,ORIG-LINK , link-1,
    id: '',  //for YOUTUBE-VIDEO
    contents: [
        {
            type: 'TEXT|BR|LINK',
            url: '',
            text: '',
        }
    ], //only for paragraph
    text: '', //for button ,ORIG-LINK ,link-1  ,H2
    //cardData example: {"related_id":100,"type":7,"cover":"https://d5qni3cga7giw.cloudfront.net/201607/19/a59c55fcef18083c21b78e310b8f47f8_750x750.jpg","title":"app 15Colony: 15%","label":"Promotion"}
    width: 850,//for img
    height: 478,//for img

};

var contextDemo = {
    typeStack: [],
    lastParagraph: null,
};

var isSpecial = function (elem) {
    var elemName = elem.nodeName;
    if (elemName === 'IMG') {
        return 'IMG';
    }
    if (elemName === 'IFRAME' && /youtube-video/.test(elem.className)) {
        //youtube video
        return 'YOUTUBE-VIDEO';
    }
    if (elemName === 'A') {
        if (/link-buy/.test(elem.className)) {
            //goto buy btn
            return 'PROMO-BUTTON';
        }
        if (/link-recommend/.test(elem.className)) {
            //goto buy btn
            return 'LINK-1';
        }
    }

    if (elemName === 'VIDEO') {
        return 'VIDEO';
    }

    if (elemName === 'DIV') {
        if (/nestia-card/.test(elem.className)) {
            return 'CARD';
        }
    }

    if (elemName === 'P') {
        if (/small/.test(elem.className)) {
            return 'H6';
        }
    }
};

var isInline = function (elem) {
    var displayStyle = window.getComputedStyle(elem).display;
    return displayStyle === 'inline' || displayStyle === 'ineline-block';
};


var contextIsEnd = function (context) {
    return context.type !== 'PARAGRAPH';
};

var newContext = function (context, type) {
    context.type = type;
    switch (type) {
        case 'PARAGRAPH':
            context.contents = [];
            break;
        case 'H2':
        case 'H6':
            context.text = '';
            break;
        case 'IMG':
            context.attrs = {};
            context.url = '';
            context.width = 0;
            context.height = 0;
            break;
        case 'PROMO-BUTTON':
        case 'LINK-1':
            context.attrs = {};
            context.url = '';
            context.text = '';
            break;
        case 'YOUTUBE-VIDEO':
            context.attrs = {};
            context.url = '';
            break;
        case 'VIDEO':
            context.attrs = {};
            context.url = '';
            break;
        case 'CARD':
            context.attrs = {};
            break;
    }
};

var doDefrag = function () {
    var result;
    var result = [];
    var id = window[DEFRAG_ELEMENT_ID];
    var domRoot = document.getElementById(id);
    if (!domRoot) {
        console.log('WARN:NO DOM ROOT');
        window[RESULT_PROP_NAME] = result;
        return result;
    }

    window[LOADING_QUEUE] = [];
    var iterate = function (root, rs, parentNodes) {
        var childNodes = root.childNodes, len = childNodes.length, node;

        if (!rs) {
            rs = [];
        }
        var context = null;
        if (rs.length > 0) {
            context = rs[rs.length - 1];
        } else {
            context = {};
            rs.push(context);
        }
        if (!parentNodes) {
            parentNodes = [];
        }
        var id = Math.floor(Math.random() * 1e5);
        for (var i = 0; i < len; i++) {
            node = childNodes[i];
            switch (node.nodeType) {

                case Node.ELEMENT_NODE:
                    var display = window.getComputedStyle(node).display;
                    if (display === 'none') {
                        break;
                    }
                    var nodeName = node.nodeName, specialType;
                    if (specialType = isSpecial(node)) {
                        // rs.push(context);
                        // context = {}

                        if (!context.type) {
                            newContext(context, specialType);
                        } else {
                            context = {};
                            newContext(context, specialType);
                            rs.push(context);
                        }
                        switch (specialType) {
                            case 'H6':
                                context.text = node.innerText;
                                break;
                            case 'IMG':
                                context.url = node.getAttribute('src');
                                var style = window.getComputedStyle(node), needLoadImg = false;
                                if (node.getAttribute('data-width') * 1) {
                                    context.width = node.getAttribute('data-width');
                                    context.clientWidth = node.getAttribute('data-client-width') || context.width;
                                } else {
                                    context.clientWidth = style.width.replace('px', '');
                                }
                                if (node.getAttribute('data-height') * 1) {
                                    context.height = node.getAttribute('data-height');
                                    context.clientHeight = node.getAttribute('data-client-height') || context.height;
                                } else {
                                    context.clientHeight = style.height.replace('px', '');
                                }

                                try {
                                    context.clientWidth = Math.floor(context.clientWidth * 1);
                                    context.clientHeight = Math.floor(context.clientHeight * 1);
                                } catch (e) {
                                }
                                if (!context.width || !context.height || isNaN(context.width) || isNaN(context.height)) {
                                    needLoadImg = true;
                                }


                                if (node.getAttribute('data-id')) {
                                    context.attrs.id = node.getAttribute('data-id')
                                }

                                if (node.getAttribute('data-news-id')) {
                                    context.attrs.news_id = node.getAttribute('data-news-id')
                                }

                                if (node.getAttribute('data-path')) {
                                    context.attrs.path = node.getAttribute('data-path')
                                }
                                if (node.getAttribute('data-desc')) {
                                    context.attrs.desc = node.getAttribute('data-desc')
                                }


                                if (needLoadImg) {
                                    (function (ctx, url) {
                                        var img = new Image();
                                        var queue = {
                                            url: url,
                                            startTime: new Date().getTime()
                                        };
                                        window[LOADING_QUEUE].push(queue);
                                        img.onload = function () {
                                            img.onload = null;
                                            var idx = -1;
                                            for (var k = 0; k < window[LOADING_QUEUE].length; k++) {
                                                if (window[LOADING_QUEUE][k].url === this.getAttribute('src')) {
                                                    idx = k;
                                                    break;
                                                }
                                            }
                                            if (idx >= 0) {
                                                window[LOADING_QUEUE].splice(idx, 1);
                                            }
                                            ctx.width = Math.floor(this.width);
                                            ctx.height = Math.floor(this.height);
                                        };
                                        img.src = url;
                                    })(context, context.url);
                                }

                                break;


                            case 'PROMO-BUTTON':
                            case 'LINK-1':


                                if (node.getAttribute('data-id')) {
                                    context.attrs.id = node.getAttribute('data-id');
                                }

                                if (node.getAttribute('data-news-id')) {
                                    context.attrs.news_id = node.getAttribute('data-news-id');
                                }

                                if (node.getAttribute('data-add-source')) {
                                    context.attrs.add_source = node.getAttribute('data-add-source');
                                }

                                if (node.getAttribute('data-style-type')) {
                                    context.attrs.style_type = node.getAttribute('data-style-type');
                                }

                                context.url = node.getAttribute('href');
                                context.text = node.innerText;
                                break;

                            case 'YOUTUBE-VIDEO':
                            case 'VIDEO':
                                if (node.getAttribute('data-id')) {
                                    context.attrs.id = node.getAttribute('data-id');
                                }

                                if (node.getAttribute('data-news-id')) {
                                    context.attrs.news_id = node.getAttribute('data-news-id');
                                }

                                if (node.getAttribute('data-source-type')) {
                                    context.attrs.source_type = node.getAttribute('data-source-type');
                                }

                                if (node.getAttribute('data-related-id')) {
                                    context.attrs.related_id = node.getAttribute('data-related-id');
                                }

                                if (node.getAttribute('data-cover-image')) {
                                    try {
                                        context.attrs.cover_image = JSON.parse(node.getAttribute('data-cover-image'));
                                    } catch (e) {
                                    }
                                }

                                context.url = node.getAttribute('src');
                                break;

                            case 'CARD':
                                if (node.getAttribute('data-news-id')) {
                                    context.attrs.news_id = node.getAttribute('data-news-id');
                                }

                                if (node.getAttribute('data-type')) {
                                    context.attrs.type = node.getAttribute('data-type');
                                }

                                if (node.getAttribute('data-related-id')) {
                                    context.attrs.related_id = node.getAttribute('data-related-id');
                                }

                                if (node.getAttribute('data-cover')) {
                                    context.attrs.cover = node.getAttribute('data-cover');
                                }

                                if (node.getAttribute('data-title')) {
                                    context.attrs.title = node.getAttribute('data-title');
                                }

                                if (node.getAttribute('data-label')) {
                                    context.attrs.label = node.getAttribute('data-label');
                                }
                                break;
                        }

                    } else if (isInline(node)) {
                        /*if (contextIsEnd(context)) {
                            rs.push(context);
                            context = {
                                contents: []
                            }
                        }*/

                        if (nodeName === 'BR') {
                            if (!context.type) {
                                newContext(context, 'PARAGRAPH');
                            } else if (context.type !== 'PARAGRAPH') {
                                context = {};
                                newContext(context, 'PARAGRAPH');
                                rs.push(context);
                            }
                            context.contents.push({
                                type: 'BR',
                            });
                        } else {
                            let pns = [].concat(parentNodes, [node]);
                            iterate(node, rs, pns)
                        }
                    } else {
                        if (context.type) {
                            context = {};
                            rs.push(context);
                        }
                        let pns = [].concat(parentNodes, [node]);
                        iterate(node, rs, pns);
                    }
                    break;
                case Node.TEXT_NODE:
                    if (node.nodeValue.trim()) {

                        var link = null, h2 = null;
                        for (var j = 0; j < parentNodes.length; j++) {
                            if (parentNodes[j].nodeName === 'A' && /^(http(s)?:)|(nestia:)/.test(parentNodes[j].getAttribute('href'))) {
                                link = parentNodes[j];
                            }
                            if (/^H[1-6]$/.test(parentNodes[j].nodeName)) {
                                h2 = parentNodes[j];
                            }
                        }
                        if (h2) {
                            if (!context.type) {
                                newContext(context, 'H2');
                            } else if (context.type !== 'H2') {
                                context = {};
                                newContext(context, 'H2');
                                rs.push(context);
                            }
                            context.text = (context.text || '') + node.nodeValue.replace(/\n/g, '');
                        } else {
                            if (!context.type) {
                                newContext(context, 'PARAGRAPH');
                            } else if (context.type !== 'PARAGRAPH') {
                                context = {};
                                newContext(context, 'PARAGRAPH');
                                rs.push(context);
                            }
                            if (link) {
                                var linkData = {
                                    type: 'LINK',
                                    url: link.getAttribute('href'),
                                    text: node.nodeValue.replace(/\n/g, ''),
                                    attrs: {}
                                };

                                if (link.getAttribute('data-id')) {
                                    linkData.attrs.id = link.getAttribute('data-id')
                                }

                                if (link.getAttribute('data-news-id')) {
                                    linkData.attrs.news_id = link.getAttribute('data-news-id')
                                }

                                if (link.getAttribute('data-news-id')) {
                                    linkData.attrs.news_id = link.getAttribute('data-news-id')
                                }

                                if (link.getAttribute('data-add-source')) {
                                    linkData.attrs.add_source = link.getAttribute('data-add-source');
                                }

                                if (link.getAttribute('data-style-type')) {
                                    linkData.attrs.style_type = link.getAttribute('data-style-type');
                                }
                                context.contents.push(linkData);
                            } else {

                                context.contents.push({
                                    type: 'TEXT',
                                    text: node.nodeValue.replace(/\n/g, ''),
                                });
                            }
                        }
                    }
                    break;
                default:

            }
        }
        return rs;
    };

    try {
        result = iterate(domRoot);
    } catch (e) {
        console.log('FAIL TO FORMAT :' + e.message, e);
    }

    var checkendInterval = null;
    var checkend = function (resolve) {
        checkendInterval = setInterval(function () {
            var now = Date.now(), toRemove = [];
            for (var i = 0; i < window[LOADING_QUEUE].length; i++) {
                if (now - window[LOADING_QUEUE][i].startTime > 10000) {
                    toRemove.unshift(i);
                }
            }
            for (i = 0; i < toRemove.length; i++) {
                window[LOADING_QUEUE].splice(toRemove[i], 1);
            }

            if (window[LOADING_QUEUE].length === 0) {
                console.log('Done defrag news: ');
                if (checkendInterval !== null) {
                    clearInterval(checkendInterval);
                    checkendInterval = null;
                }
                resolve();
            }
        }, 100);
    };

    var promise = new Promise(checkend);
    promise.then(() => {
        window[RESULT_PROP_NAME] = result;
    });

};
$(function () {
    try {
        console.log('Begin defrag news: ');
        doDefrag();
    } catch (e) {
        console.log('ERROR defrag news: ' + e.message, e);
    }
});

