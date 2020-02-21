const getPrev = function (results, idx) {
    for (let i = idx - 1; i >= 0; i--) {
        if (!results[i]) {
            return null;
        }
        if (!results[i].deleted) {
            return i;
        }
    }
    return null;
};

const matchAdv = function (text) {
    if (/联系小圈/.test(text)) {
        return true;
    }
    if (/^QQ[^\w]*\d+/.test(text)) {
        return true;
    }
    if (/^邮箱[^\w]*.+@.+/.test(text)) {
        return true;
    }
    if (/^微信[^\w]*/.test(text)) {
        return true;
    }
    return false;
};

const WHITE_LIST_USER_IDS = require('./whiteList');


module.exports = function (results, params) {
    let toRemove = [];
    //remove prostitution advertisement
    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        let hasContent = false;
        if (result.type === 'PARAGRAPH' && result.height < 45) {
            let removeIdx = [];
            for (let j = 0; j < result.contents.length; j++) {
                let content = result.contents[j];
                if (content.type === 'LINK') {
                    hasContent = true;
                }
                if (content.type === 'TEXT') {
                    if (matchAdv(content.text)) {
                        // hasContent = true;
                        removeIdx.unshift(j);
                    } else {
                        hasContent = true;
                    }
                }
            }
            if (!hasContent) {
                result.deleted = true;
                toRemove.unshift(i);
            }
            for (let j of removeIdx) {
                result.contents.splice(j, 1);
            }

        }
    }
    for (let i of toRemove) {
        results.splice(i, 1);
    }
    toRemove = [];
    for (let i = 0; i < results.length; i++) {
        let result = results[i];
        if (result.type === 'PARAGRAPH') {
            //no start with br and  end with br
            while (result.contents.length > 0 && result.contents[0].type === 'BR') {
                result.contents.splice(0, 1);
            }
            while (result.contents.length > 0 && result.contents[result.contents.length - 1].type === 'BR') {
                result.contents.splice(result.contents.length - 1, 1);
            }
            //no empty paragraph
            if (result.contents.length === 0) {
                toRemove.unshift(i);
            }
        } else if (result.type === 'IMG') {
            let width = result.clientWidth || result.width;
            let height = result.clientHeight || result.height;
            if (width > 0 && height > 0 && width * 1 + height * 1 < 200) {
                /*remove very small img*/
                toRemove.unshift(i);
            }
        }

    }

    for (let i of toRemove) {
        results.splice(i, 1);
    }

    // toRemove = [];

    let userId = params && params.source && params.source.author_id;
    if (userId && WHITE_LIST_USER_IDS.indexOf(userId) >= 0) {
        return results;
    }


    /*  for (let i = 0; i < results.length; i++) {
          let result = results[i];
          if (result.type === 'PARAGRAPH' && result.height < 45) {
              let prev = getPrev(results, i);
  
  
              if (results[prev] && results[prev].type === 'PARAGRAPH') {
                  let prev2 = getPrev(results, prev);
                  if (!results[prev2] || results[prev2].type !== 'IMG') {
                      results[prev].contents = results[prev].contents.concat(
                          [
                              {
                                  type: 'BR'
                              }
                          ], result.contents);
                      result.deleted = true;
                      toRemove.unshift(i);
                  }
              }
  
          }
      }
      for (let i of toRemove) {
          results.splice(i, 1);
      }*/

    return results;
}
;