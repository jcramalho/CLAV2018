const { json2xml } = require('./../controllers/conversor/json2xml.js')
const { json2csv } = require('./../controllers/conversor/json2csv.js')

const notSup = "Esta rota não suporta exportação para CSV. Contudo pode exportar para JSON (application/json ou json) ou XML (application/xml ou xml) nesta rota."

module.exports.outputFormat = async (req, res, next) => {
	if (res.locals.dados) {
	    const outF = req.query.fs || req.headers.accept

        switch (outF) {
            case 'application/json':
            case 'json':
                res.jsonp(res.locals.dados)
                break
            case 'application/xml':
            case 'xml':
                res.setHeader('content-type', 'application/xml')
                res.send(json2xml(res.locals.dados))
                break
            case 'text/csv':
            case 'excel/csv':
            case 'csv':
                if(res.locals.tipo){
                    res.setHeader('content-type', 'text/csv')
                    var csv = json2csv(res.locals.dados, res.locals.tipo)

                    if(outF == 'excel/csv'){
                        csv = csv.replace(/#\n/g,"#")
                    }

                    res.send(csv)
                }else{
                    res.status(406).send(notSup)
                }
                break
            default:
                res.jsonp(res.locals.dados)
                break
        }
    }else{
        next()
    }
}
