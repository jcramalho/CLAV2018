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
                if(res.locals.tipo){
                    res.setHeader('content-type', 'text/csv');
                    res.send(json2csv(res.locals.dados, res.locals.tipo))
                }else{
                    res.status(406).send("Esta rota não suporta exportação para CSV. Contudo pode exportar para JSON (application/json ou json) ou XML (application/xml ou xml) nesta rota.")
                }
                break
            default:
                res.json(res.locals.dados)
                break
        }
    }
}
