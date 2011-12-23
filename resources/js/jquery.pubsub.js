/*	jQuery pub/sub plugin by Peter Higgins (dante@dojotoolkit.org) */

(function (d) {
    var cache = {};

    d.publish = function (/* String */topic, /* Array? */args) {
        cache[topic] && d.each(cache[topic], function () {
            this.apply(d, args || []);
        });
    };

    d.subscribe = function (/* String */topic, /* Function */callback) {
        if (!cache[topic]) {
            cache[topic] = [];
        }
        cache[topic].push(callback);
        return [topic, callback]; // Array
    };

    d.unsubscribe = function (/* Array */handle) {
        var t = handle[0];
        cache[t] && d.each(cache[t], function (idx) {
            if (this == handle[1]) {
                cache[t].splice(idx, 1);
            }
        });
    };

})(jQuery);



























