; (function (window) {
    'use strict';
    function throttle(func, delay) {
        let timer = null;
        let startTime = Date.now();
        return function () {
            const remaining = delay - (Date.now() - startTime);
            const context = this;
            const args = arguments;
            if (timer) clearTimeout(timer);
            if (remaining <= 0) {
                func.apply(context, args);
                startTime = Date.now();
            } else {
                timer = setTimeout(func, remaining);
            }
        };
    }
    function core() {
        if (window.outerWidth >= 800) {
            document.querySelector('#cust_style') && document.querySelector('#cust_style').remove()
            var styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.id = 'cust_style';
            document.getElementsByTagName('head')[0].appendChild(styleElement);
            document.querySelector('#content').scrollHeight >= 540 &&
                styleElement.appendChild(document.createTextNode(`
                #content {
                    height:${window.outerHeight - 200}px;
                }
            `));
            styleElement.appendChild(document.createTextNode(`
                #console {width: 800px; height:${window.outerHeight}px; border: 1px #ddd solid; top: 0px; right: 0px; z-index: 999; overflow:hidden; position: fixed; background: rgba(253, 253, 253, 0.993); overflow: hidden;}
            `));
        } else document.querySelector('#cust_style') && document.querySelector('#cust_style').remove()
    }
    let lazyLayout = throttle(core, 200)
    window.onresize = lazyLayout
    const theResizeObserver = new ResizeObserver(lazyLayout);
    const theElement = document.querySelector('#content')
    theResizeObserver.observe(theElement);
    //解绑
    window.onbeforeunload = function () {
        theResizeObserver.unobserve(theElement);
        theResizeObserver = null;
    };
    core()
}(this));