'use strict';

const Audit = require('lighthouse').Audit;

const MAX_REQUEST_TIME = 3000;

class RequestAudit extends Audit {
    static get meta() {
        return {
            category: 'MyPerformance',
            name: 'request-audit',
            description: 'Time for first request',
            failureDescription: 'First request slow to load',
            helpText: 'Used to measure time from first request to load',

            requiredArtifacts: ['TimeToRequest']
        };
    }

    static audit(artifacts) {
        const loadedTime = artifacts.TimeToRequest;

        const belowThreshold = loadedTime <= MAX_REQUEST_TIME;

        return {
            rawValue: loadedTime,
            score: belowThreshold
        };
    }
}

module.exports = RequestAudit;