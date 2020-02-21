
let replaceLinks = function (source, links) {
    if (Array.isArray(links)) {
        for (let link of links) {
            let linkHtml = '';
            switch (link.style_type) {
                case 1://normal link
                    linkHtml = `<a href="${link.href}" data-id="${link.id}" data-news-id="${link.news_id}" data-add-source="${link.add_source}" data-style-type="${link.style_type}">${link.text}</a>`;
                    break;
                case 2://promotion btn
                    linkHtml = `<a class="link-recommend" href="${link.href}" data-id="${link.id}" data-news-id="${link.news_id}" data-add-source="${link.add_source}" data-style-type="${link.style_type}">${link.text}</a>`;
                    break;
                case 3://block link
                    linkHtml = `<a class="link-buy" href="${link.href}" data-id="${link.id}" data-news-id="${link.news_id}" data-add-source="${link.add_source}" data-style-type="${link.style_type}">${link.text}</a>`;
                    break;
            }
            source = source.replace(link.key, linkHtml);
        }
    }
    return source;
};

let replaceImages = function (source, imgs) {
    if (Array.isArray(imgs)) {
        for (let img of imgs) {
            let imgHtml = `<img src="${img.url}" data-id="${img.id}" data-news-id="${img.news_id}" data-path="${img.path}" data-desc="${(img.description || '').replace(/\"/g, '&quot;')}" data-width="${img.width}" data-height="${img.height}" data-client-width="${img.clientWidth || img.width}" data-client-height="${img.clientHeight || img.height}"/>`;
            source = source.replace(img.key, imgHtml);
        }
    }
    return source;
};


let replaceVideos = function (source, videos) {
    if (Array.isArray(videos)) {
        for (let video of videos) {
            let videoHTML = '';
            let cover = '';
            if (video.cover_image) {
                cover = JSON.stringify(cover);
                cover = cover.replace(/"/g, '&quot;')
            }
            switch (video.source_type) {
                case 1:
                    videoHTML = `<video controls preload="none" src="${video.url}" data-id="${video.id}" data-news-id="${video.news_id}" data-source-type="${video.source_type}" data-related-id="${video.related_id}" data-cover-image="${cover}"></video>`;
                    break;
                case 2:
                    videoHTML = `<iframe class="youtube-video" src="${video.url}" data-id="${video.id}" data-news-id="${video.news_id}" data-source-type="${video.source_type}" data-related-id="${video.related_id}" data-cover-image="${cover}"></iframe>`;
                    break;
            }
            
            source = source.replace(video.key, videoHTML);
        }
    }
    return source;
};

let replaceCards = function (source, cards) {
    if (Array.isArray(cards)) {
        for (let card of cards) {
            let cardHTML = `<div class="nestia-card"  data-news-id="${card.news_id}" data-related-id="${card.related_id}" data-type="${card.type}" data-cover="${card.cover}" data-title="${card.title}" data-label="${card.label}"></div>`;
            source = source.replace(card.key, cardHTML);
        }
    }
    return source;
};

module.exports = function (source) {
    let baseTemplate = source.content;
    let result = baseTemplate;
    result = replaceLinks(result, source.links);
    result = replaceImages(result, source.images);
    result = replaceVideos(result, source.article_videos);
    result = replaceCards(result, source.cards);
    return result;
};