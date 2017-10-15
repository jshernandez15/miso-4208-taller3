'use strict';

const Gatherer = require('lighthouse').Gatherer;

class TimeToRequest extends Gatherer {
    afterPass(options) {
        const driver = options.driver;

        return driver.evaluateAsync('window.firstRequest')
            .then(firstRequest => {
                if (!firstRequest) {

                    throw new Error('Unable to find card load metrics in page');
                }
                return firstRequest;
            });
    }
}

module.exports = TimeToRequest;