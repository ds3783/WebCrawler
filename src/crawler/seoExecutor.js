const PageFactory = require("../browser/pageFactory");
const utils = require("./utils");
const NestiaWeb = require("nestia-web");
const uuid = require("uuid");

function randomStr(length) {
    "use strict";
    const chars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'k', 'j', 'h', 'g', 'f', 'd', 's', 'a', 'z', 'x', 'c', 'v', 'b', 'n', 'm'];
    let str = '';
    for (let i = 0; i < length; i++) {
        let idx = Math.floor(Math.random() * chars.length);
        str += chars[idx];
    }
    return str;
}

async function start(context) {
    "use strict";
    context = context || {};
    context.key = uuid.v4();
    NestiaWeb.logger.info('Starting seo job:' + JSON.stringify(context, null, ''));
    //获得浏览器页面
    let page = context.page;
    if (!page) {
        page = await PageFactory.getPage(context);
    }
    let skipSearch = false;
    try { //Go to google.com
        await page.goto('https://www.google.com');
        //look for the search box
        await page.waitForSelector('form');
    } catch (e) {
        NestiaWeb.logger.error('Failed to load google.com:' + e.message);
        let randomAqs = `chrome..${randomStr('69i52j33i160'.length)}.${randomStr('279j0j7'.length)}`;
        let search = encodeURIComponent((context.tags || '').replace(/,/g, ' '));
        let searchUrl = `https://www.google.com/search?q=${search}&oq=${search}&aqs=${randomAqs}&sourceid=chrome&ie=UTF-8`
        NestiaWeb.logger.info('Try go directly to:' + searchUrl);
        try {
            await page.evaluate((url) => {
                location.href = url;
            }, searchUrl);
            skipSearch = true;
        } catch (e) {
            NestiaWeb.logger.error('FATAL-Failed to load google.com:' + e.message);
            return;
        }
    }
    if (!skipSearch) {
        //fetch the search box id
        let search_box_id = await page.evaluate(() => {
            let search_box = document.querySelectorAll('textarea');
            if (!search_box.length) {
                search_box = document.querySelector('input.lst');
                if (search_box.id) {
                    return search_box.id;
                } else {
                    search_box.setAttribute('id', 'lst-ib');
                    return 'lst-ib'
                }
            } else {
                for (let box of search_box) {
                    if (box.autofocus) {
                        return box.id;
                    }
                }
            }

        });
        //type in the search box
        await utils.fillForm(page, '#' + search_box_id, (context.tags || '').replace(/,/g, ' '));
        NestiaWeb.logger.info('Filled search box:' + context.tags);
        await utils.sleep(1000);
        //click the search button
        await page.evaluate(() => {
            document.querySelector('input[type="submit"]').click();
        });
        //wait for the search results
        await page.waitForNavigation()
    }
    await page.waitForSelector('div#main');
    //fetch the search results
    let search_results = await page.evaluate((domain) => {
        let results = [];
        let search_results = document.querySelectorAll('div#main div.g');
        if (search_results.length === 0) {
            search_results = document.querySelectorAll('div#main div.Gx5Zad');
        }
        for (let i = 0; i < search_results.length; i++) {
            let result = search_results[i];
            let title = result.querySelector('h3');
            let url = result.querySelector('cite');
            if (!url) {
                url = result.querySelector('a');
                url = url.getAttribute('href').replace(/\/url\?q=/, '');
            } else {
                url = url.innerText;
            }
            let marked = false;
            if (url.indexOf(domain) > -1) {
                if (/\/\d{4}\/\d{2}\//.test(url) || (!marked && i === search_results.length - 1)) {
                    result.setAttribute('id', 'that_is_it');
                    marked = true;
                }
                results.push({
                    title: title.innerText,
                    url: url
                });
            }
        }
        return results;
    }, context.domain);
    NestiaWeb.logger.info('Search results:' + JSON.stringify(search_results, null, ''));
    if (search_results.length > 0) {
        //click that_is_it
        let url = await page.evaluate(() => {
            return document.querySelector('div#that_is_it a').getAttribute('href');
        });
        await page.click('div#that_is_it a');
        NestiaWeb.logger.info('Clicked result', url);
        await utils.sleep(20000);
        await page.evaluate(() => {
            location.href = '/';
        });
        NestiaWeb.logger.info('Redirected to home page');
        await utils.sleep(5000);
        NestiaWeb.logger.info('Job done');
    } else {
        let search_results=[];
        try {
            search_results = await page.evaluate(() => {
                let results = [];
                let search_results = document.querySelectorAll('div#main div.g');
                if (search_results.length === 0) {
                    search_results = document.querySelectorAll('div#main div.Gx5Zad');
                }
                for (let i = 0; i < search_results.length; i++) {
                    let result = search_results[i];
                    let title = result.querySelector('h3');
                    let url = result.querySelector('cite');
                    if (!url) {
                        url = result.querySelector('a');
                        url = url.getAttribute('href').replace(/\/url\?q=/, '');
                    } else {
                        url = url.innerText;
                    }
                    let marked = false;
                    if (/^\/url\?.*url=.*$/.test(url)) {
                        let url = new URL(url);
                        url = url.searchParams.get('url');
                    }
                    results.push({
                        title: title.innerText,
                        url: url
                    });
                }
                return results;
            });
        } catch (e) {
            NestiaWeb.logger.error('Failed to extract search results:' + e.message);
        }
        NestiaWeb.logger.info('No search result found, done.', JSON.stringify(context, null, ''), 'current results:', JSON.stringify(search_results, null, ''));

    }
}


module.exports = {
    start: start
} 
