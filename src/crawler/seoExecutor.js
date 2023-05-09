const PageFactory = require("../browser/pageFactory");
const utils = require("./utils");
const NestiaWeb = require("nestia-web");
const uuid = require("uuid");

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
    //Go to google.com
    await page.goto('https://www.google.com');
    //look for the search box
    await page.waitForSelector('form');
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
    await page.waitForSelector('div#main');
    //fetch the search results
    let search_results = await page.evaluate(() => {
        let results = [];
        let search_results = document.querySelectorAll('div#main div.g');
        if (search_results.length === 0) {
            search_results = document.querySelectorAll('div#main div.Gx5Zad');
        }
        for (let result of search_results) {
            let title = result.querySelector('h3');
            let url = result.querySelector('cite');
            if (!url) {
                url = result.querySelector('a');
                url = url.getAttribute('href').replace(/\/url\?q=/, '');
            } else {
                url = url.innerText;
            }
            if (/ds3783/.test(url)) {
                result.setAttribute('id', 'that_is_it');
                results.push({
                    title: title.innerText,
                    url: url
                });
            }
        }
        return results;
    });
    NestiaWeb.logger.info('Search results:' + JSON.stringify(search_results, null, ''));
    if (search_results.length > 0) {
        //click that_is_it
        await page.click('div#that_is_it a');
        NestiaWeb.logger.info('Clicked result');
        await utils.sleep(20000);
        await page.evaluate(() => {
            location.href = '/';
        });
        NestiaWeb.logger.info('Redirected to home page');
        await utils.sleep(5000);
        NestiaWeb.logger.info('Job done');
    }else{
        NestiaWeb.logger.info('No search result found, done.');
    }
}


module.exports = {
    start: start
} 
