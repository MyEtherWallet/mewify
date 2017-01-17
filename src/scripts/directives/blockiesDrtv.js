'use strict';
var blockiesDrtv = function() {
    return function(scope, element, attrs) {
        var watchVar = attrs.watchVar;
        scope.$watch(watchVar, function() {
            var address = attrs.blockieAddress;
            var content = blockies.create({
                seed: address.toLowerCase(),
                size: 8,
                scale: 16
            }).toDataURL();
            if (address) {
                element.css({
                    'background-image': 'url(' + content + ')'
                });
            }
        });
    };
};
module.exports = blockiesDrtv;
