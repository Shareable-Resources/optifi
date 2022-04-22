const router = require('aws-lambda-router');
const { getInstruments, getOptifiMarkets, getInstruments2, getInstrumentByOtifiMarketAddr, getInstrumentByOtifiMarketId, getProgram } = require('service.js')

exports.handler = router.handler({
    proxyIntegration: {
        routes: [{
            path: '/',
            method: 'GET',
            action: (request, context) => {
                console.log(request, context)
                console.log("path: /")
                return "You called me with: " + request.path;
            }
        },
        {
            path: '/test',
            method: 'GET',
            action: (request, context) => {
                return "You called me with: " + request.path;
                // return getInstruments("hjo3CZHSkssq4df3uhYPEuJMdAstA6qc3EEYNDXAxvW", "111171")
            }
        },
        {
            path: '/optifiMarkets',
            method: 'POST',
            action: (request, context) => {
                return getOptifiMarkets(request.body.programId, request.body.exchangeUuid)
            }
        },
        {
            path: '/instruments',
            method: 'POST',
            action: (request, context) => {
                return getInstruments2(request.body.programId, request.body.exchangeUuid)
            }
        },
        {
            path: '/instruments/instrumentByOptifiMarketAddr',
            method: 'POST',
            action: (request, context) => {
                return getInstrumentByOtifiMarketAddr(request.body.optifiMarketAddress)
            }
        },
        {
            path: '/instruments/instrumentByOptifiMarketId',
            method: 'POST',
            action: (request, context) => {

                return getInstrumentByOtifiMarketId(request.body.programId, request.body.exchangeUuid, request.body.optifiMarketId)
            }
        }
        ]
    }
})
