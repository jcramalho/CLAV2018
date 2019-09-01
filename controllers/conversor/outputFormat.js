const { json2xml } = require('./json2xml.js')
const { json2csv } = require('./json2csv.js')

module.exports.outputFormat = (req, res, next) => {
	if (res.locals.dados) {
	    const outF = req.query.OF || req.headers.accept

        switch (outF) {
            case 'application/json':
            case 'json':
                res.json(res.locals.dados)
                break
            case 'application/xml':
            case 'xml':
                res.setHeader('content-type', 'application/xml')
                res.send(json2xml(res.locals.dados))
                break
            case 'text/csv':
            case 'csv':
                res.setHeader('content-type', 'text/csv');
                res.send(json2csv(res.locals.dados))
                //res.send(res.locals.dados)
                break
            case 'rdf':
                break
            default:
                res.json(res.locals.dados)
                break
        }
    }
}
