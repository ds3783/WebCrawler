const replaceHtml = function (txt) {
    txt = txt || '';
    txt = txt.replace(/</g, '&lt;');
    txt = txt.replace(/>/g, '&gt;');
    txt = txt.replace(/>/g, '&gt;');
    txt = txt.replace(/"/g, '&quot;');
    txt = txt.replace(/'/g, '&#39;');
    return txt;
};


module.exports = function (resultObj, isChinese) {
    let result = [];
    result.push({
        html: '<div class="placeholder-bottom"></div>'
    });
    for (let r of resultObj) {
        let content = [];
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
                            content.push(`<a>${replaceHtml(c.text)}</a>`);
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
                content.push(`<div class="img-container"><img src="${r.url}" data-width="${r.width}" data-height="${r.height}" data-client-width="${r.clientWidth || ''}" data-client-height="${r.clientHeight || ''}"/></div>`);
                /*images.push(Object.assign({
                    key: `<!--IMG#${idx}-->`,
                    url: r.url,
                    width: r.width * 1,
                    height: r.height * 1,
                }, r.attrs));*/
                break;

            case 'CARD':
                content.push(`<div class="js-card" style="width:100%;height:6rem;margin: 1.5rem 0;"></div>`);
                break;

            case 'PROMO-BUTTON':
                content.push(`<a class="link-buy" href="${r.url}">${replaceHtml(r.text)}</a>`);
                break;

            case 'YOUTUBE-VIDEO':
                content.push(`<iframe class="youtube-video" type="text/html" src="${r.url}?enablejsapi=0&amp;autoplay=0&amp;fs=0&amp;loop=1&amp;rel=0&amp;playsinline=1" frameborder="0"></iframe>`);
                break;

            case 'VIDEO':
                content.push(`<video src="${r.url}" preload="none" controls></video>`);
                break;

            case 'LINK-1':
                content.push(`<a class="link-recommend" href="${r.url}"><div class="icon"></div><div class="text">${replaceHtml(r.text)}</div></a>`);

                break;


        }
        result.push({
            html: content.join(''),
            json: r
        });
    }
    result.push({
        html: '<div class="placeholder-bottom"></div>'
    });
    return result;
};