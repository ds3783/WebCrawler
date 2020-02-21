//

var css = "" +
    "body{padding:0 20px;}" +
    "body>:first-child:not(.placeholder-top){margin-top:1.5rem!important;}" +
    ".placeholder-top + *{margin-top:0.75rem;}" +
    ".placeholder-bottom{height:1.5rem}";

var resetFont = function () {
    var doc = document;

    var lastFontSize = null;
    var docEle = doc.documentElement,
        evt = "onorientationchange" in window ? "orientationchange" : "resize",
        fn = function () {
            var width = docEle.clientWidth;
            var scale = window.font_adjust_scale_value || 1;
            var fs = scale * 16 * (width / 375);
            if (fs !== lastFontSize) {
                width && (docEle.style.fontSize = fs + "px");
                lastFontSize = fs;
            }
        };

    window.addEventListener(evt, fn, false);
    fn();
    setInterval(function () {
        fn();
    }, 500);
};

var adjustImg = function (img) {
    var width = img.getAttribute('data-width') * 1;
    var height = img.getAttribute('data-height') * 1;
    if (isNaN(width) || isNaN(height) || !width || !height) {
        return;
    }
    if (width < 200) {
        img.setAttribute('width', width);
        img.setAttribute('height', height);
    }
    var containerStyle = window.getComputedStyle(img.parentElement);
    var containerWidth = containerStyle.width.replace('px', '') * 1;
    if (isNaN(containerWidth) || !containerWidth) {
        return;
    }
    img.setAttribute('width', containerWidth);
    img.setAttribute('height', Math.round(height * (containerWidth / width)));
};

//inject css
var head = document.head;
var style = document.createElement('style');
style.innerHTML = css;
head.insertBefore(style, head.firstElementChild);
//adjust font size 
window.Nestia && window.Nestia.scaleFont();
resetFont();

function ready() {
    //adjust font size 
    window.Nestia && window.Nestia.scaleFont();
    //adjust img
    var imgs = body.getElementsByTagName('IMG');
    for (var i = 0; i < imgs.length; i++) {
        adjustImg(imgs[i]);
    }


}


// The ready event handler and self cleanup method
function completed() {
    document.removeEventListener("DOMContentLoaded", completed);
    window.removeEventListener("load", completed);
    ready();
}

// Catch cases where $(document).ready() is called
// after the browser event has already occurred.
// Support: IE <=9 - 10 only
// Older IE sometimes signals "interactive" too soon
if (document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)) {

    // Handle it asynchronously to allow scripts the opportunity to delay ready
    window.setTimeout(ready);

} else {

    // Use the handy event callback
    document.addEventListener("DOMContentLoaded", completed);

    // A fallback to window.onload, that will always work
    window.addEventListener("load", completed);
}


