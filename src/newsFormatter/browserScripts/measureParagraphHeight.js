let replaceHtml = function (txt) {
    txt = txt || '';
    txt = txt.replace(/</g, '&lt;');
    txt = txt.replace(/>/g, '&gt;');
    txt = txt.replace(/>/g, '&gt;');
    txt = txt.replace(/"/g, '&quot;');
    txt = txt.replace(/'/g, '&#39;');
    return txt;
};

window.measureParagraphHeight = function (results) {
    document.body.innerHTML = '<div id="test-zone"></div>';
    var zone = document.getElementById('test-zone');

    for (let r of results) {
        let content = [];
        if (r.type === 'PARAGRAPH') {

            zone.innerHTML = '';
            content.push('<p id="result">');
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

            zone.innerHTML = content.join('');
            zone.offsetLeft;
            r.height = document.getElementById("result").clientHeight;
        }
    }
    return results;
};