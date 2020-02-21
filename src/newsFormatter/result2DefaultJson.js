const replaceHtml = function (txt) {
    txt = txt || '';
    txt = txt.replace(/</g, '&lt;');
    txt = txt.replace(/>/g, '&gt;');
    txt = txt.replace(/>/g, '&gt;');
    txt = txt.replace(/"/g, '&quot;');
    txt = txt.replace(/'/g, '&#39;');
    return txt;
};

module.exports = function (results, isChinese) {
    let content = [], links = [], cards = [], article_videos = [], images = [];
    // content.push('<div class="placeholder-top"></div>');
    for (let r of results) {
        let idx;
        switch (r.type) {
            case 'PARAGRAPH':
                content.push(`<p class="${isChinese ? 'cn' : ''}">`);
                for (let c of r.contents) {
                    switch (c.type) {
                        case 'TEXT':
                            content.push(replaceHtml(c.text));
                            break;
                        case 'BR':
                            content.push('<br/>');
                            break;
                        case 'LINK':
                            idx = links.length;
                            content.push(`<!--LINK#${idx}-->`);
                            links.push(Object.assign({
                                key: `<!--LINK#${idx}-->`,
                                text: c.text,
                                href: c.url,
                            }, c.attrs));
                            break;
                    }
                }
                content.push('</p>');
                break;

            case 'H2':
                content.push(`<h2>${replaceHtml(r.text)}</h2>`);
                break;

            case 'H6':
                content.push(`<p class="small ${isChinese ? 'cn' : ''}">${replaceHtml(r.text)}</p>`);
                break;

            case 'IMG':
                idx = images.length;
                content.push(`<!--IMG#${idx}-->`);
                images.push(Object.assign({
                    key: `<!--IMG#${idx}-->`,
                    url: r.url,
                    width: r.width * 1,
                    height: r.height * 1,
                    clientWidth: r.clientWidth * 1,
                    clientHeight: r.clientHeight * 1,
                }, r.attrs));
                break;

            case 'CARD':
                idx = cards.length;
                content.push(`<!--CARD#${idx}-->`);
                cards.push(Object.assign({
                    key: `<!--CARD#${idx}-->`,
                }, r.attrs));
                break;

            case 'PROMO-BUTTON':
                idx = links.length;
                content.push(`<!--LINK#${idx}-->`);
                links.push(Object.assign({
                    key: `<!--LINK#${idx}-->`,
                    text: r.text,
                    href: r.url,
                }, r.attrs));
                break;

            case 'YOUTUBE-VIDEO':
            case 'VIDEO':
                idx = article_videos.length;
                content.push(`<!--ARTICLE_VIDEO#${idx}-->`);
                article_videos.push(Object.assign({
                    key: `<!--ARTICLE_VIDEO#${idx}-->`,
                    url: r.url,
                }, r.attrs));
                break;

            case 'LINK-1':
                idx = links.length;
                content.push(`<!--LINK#${idx}-->`);
                links.push(Object.assign({
                    key: `<!--LINK#${idx}-->`,
                    text: r.text,
                    href: r.url,
                }, r.attrs));
                break;

            case 'ADV-1':
                idx = links.length;
                content.push(`<!--ADV-->`);
                break;

        }
    }
    // content.push('<div class="placeholder-bottom"></div>');
    return {
        content: content.join(''),
        links,
        cards,
        article_videos,
        images
    }
};