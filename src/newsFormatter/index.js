const path = require('path');
const fs = require('fs');
const NestiaWeb = require('nestia-web');


const FromatResult = require('./formatResult');
const Result2DefaultJson = require('./result2DefaultJson');
const Result2DefaultHTMLArr = require('./result2DefaultHtml');
const defaultJob = {
    headlessBrowser: true,
    useBlankPage: true,
};

const FormatSupport = require('./formatSupport');

let BROWSER_SCRIPTS = {};

const format = async function (params) {
    let job = Object.assign({}, defaultJob, params);
    const formatter = FormatSupport.getFormatter(params);

    // NestiaWeb.logger.warn('DEBUG: original format params:', JSON.stringify(job));
    const page = await formatter.newPage(job);
    await formatter.fetchContent(page, job, BROWSER_SCRIPTS);

    const isChinese = job.isChinese;


    await formatter.preDefrag(page, job, BROWSER_SCRIPTS);
    // page.injectDefragScript
    try {
        await page.evaluate(jsContent => {
            console.log('Injection defrag script....');
            try {
                eval(jsContent);
                // var script = document.createElement('script');
                // script.innerHTML = jsContent;
                // (document.body||document.head ).appendChild(script);
                console.log('Injection defrag script done, length:' + jsContent.length);
            } catch (e) {
                console.log('Injection defrag script ERROR', e.message);
            }
        }, BROWSER_SCRIPTS['defrag.js']);
    } catch (e) {
        NestiaWeb.logger.error('def error', e.message, e);
    }
    await formatter.postDefrag(page, job, BROWSER_SCRIPTS);
    // getResult
    let resultObj = await page.waitForFunction(() => {
        // return document.head.innerHTML;
        return window.__NESTIA_DEFRAG_RESULT__ ? JSON.stringify(window.__NESTIA_DEFRAG_RESULT__) : '';
    }, {polling: 300, timeout: 60000});
    resultObj = await resultObj.jsonValue();
    resultObj = JSON.parse(resultObj);

    //reload
    await page.goto('about:blank?' + Math.random(), {
        waitUntil: 'domcontentloaded'
    });
    await page.setViewport({
        width: 320,
        height: 568,
        deviceScaleFactor: 1,
        isMobile: false,

    });


    //<link href="https://news.nestia.com/getIncCss" rel="stylesheet" type="text/css">
    await page.evaluate(() => {
        var link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('type', 'text/css');
        link.setAttribute('href', 'https://news.nestia.com/getIncCss?' + Math.random());
        document.head.appendChild(link);

        var css = "" +
            "body{padding:0 20px;}" +
            "body>:last-child{margin-bottom:0!important;}" +
            ".placeholder-top{height:0.75rem}" +
            ".placeholder-bottom{height:1.5rem}";
        var style = document.createElement('style');
        style.innerHTML = css;
        document.head.appendChild(style);
    });

    // measure paragraph height

    await page.evaluate(jsContent => {
        var script = document.createElement('script');
        script.innerHTML = jsContent;
        document.head.appendChild(script);
    }, BROWSER_SCRIPTS['measureParagraphHeight.js']);

    resultObj = await page.evaluate((results) => {
        if (window.measureParagraphHeight) {
            return window.measureParagraphHeight(results) || [];
        } else {
            return [];
        }
    }, resultObj);

    //formatResult
    resultObj = FromatResult(resultObj, params);


    // rerender
    let retHTMLs = Result2DefaultHTMLArr(resultObj, isChinese);

    // add adv
    await page.evaluate(jsContent => {
        var script = document.createElement('script');
        script.innerHTML = jsContent;
        document.head.appendChild(script);
    }, BROWSER_SCRIPTS['contentJustify.js']);

    await page.evaluate(jsContent => {
        var script = document.createElement('script');
        script.innerHTML = jsContent;
        document.head.appendChild(script);
    }, BROWSER_SCRIPTS['advPosDecision.js']);
    let advIdxs = await page.evaluate((htmls, noAdv) => {
        if (window.decideAdvPosition) {
            try {
                return window.decideAdvPosition(htmls, {
                    tops: noAdv ? [] : [229, 989],
                    minGap: 1,
                }) || [];
            } catch (e) {
                console.log('ERROR LOCATE ADV POSITION:' + e.message, e.stack);
                return [];
            }
        } else {
            return [];
        }
    }, retHTMLs, params.noAdv);
    advIdxs.sort((a, b) => {
        return (b - a);
    });
    for (let advIdx of advIdxs) {
        resultObj.splice(advIdx, 0, {
            type: 'ADV-1'
        });
    }
    /*if (resultObj.length > 5) {
  resultObj.splice(4, 0, {
      type: 'ADV-1'
  });
}
if (resultObj.length > 3) {
  resultObj.splice(2, 0, {
      type: 'ADV-1'
  });
}*/


    //render2Json
    let retObj = Result2DefaultJson(resultObj, isChinese);
    let override = await formatter.filterResult(retObj, job);
    if (!!override) {
        retObj = override;
    }
    // page.close();
    await formatter.releasePage(page, job);
    // NestiaWeb.logger.warn('DEBUG: formatted params:', JSON.stringify(retObj));
    return retObj;
};

(function () {
    let scriptPath = path.join(__dirname, 'browserScripts');
    let files = fs.readdirSync(scriptPath);
    for (let file of files) {
        let fullPath = path.join(scriptPath, file);
        let fileState = fs.lstatSync(fullPath);
        if (!fileState.isDirectory() && /^.*\.js$/.test(file)) {
            BROWSER_SCRIPTS[file] = fs.readFileSync(fullPath, {encoding: 'utf8'});
        }
    }
})();

module.exports = {
    format
};