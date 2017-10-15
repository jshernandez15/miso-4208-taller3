'use strict';

module.exports = {

    extends: 'lighthouse:default',

    passes: [{
        passName: 'defaultPass',
        gatherers: [
            'card-gatherer',
            'request-gatherer'
        ]
    }],

    audits: [
        'card-audit',
        'request-audit'
    ],

    categories: {
        ratp_pwa: {
            name: 'Ratp pwa metrics',
            description: 'Metrics for the ratp timetable site',
            audits: [
                {id: 'card-audit', weight: 0.3},
                {id: 'request-audit', weight: 0.7}
            ]
        }
    }
};