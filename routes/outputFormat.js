const { json2xml } = require('./../controllers/conversor/json2xml.js')
const { json2csv } = require('./../controllers/conversor/json2csv.js')

const notSup = "Esta rota não suporta exportação para CSV. Contudo pode exportar para JSON (application/json ou json) ou XML (application/xml ou xml) nesta rota."

function searchClasse(proc, classes){
    var status = null

    if(classes[0] && classes[0].filhos){
        var aux = proc.substr(1).split('.')
        var codigos = [aux[0]]

        for(var w = 1; w < aux.length; w++)
            codigos.push(codigos[w-1] + "." + aux[w])

        var classe
        for(var j = 0; j < codigos.length; j++){
            classe = null

            for(var i=0; i < classes.length && classe == null; i++)
                if(classes[i].codigo == codigos[j])
                    classe = classes[i]

            if(classe)
                classes = classe.filhos
        }

        if(classe)
            status = classe.status
    }else{
        for(var i=0; i < classes.length && status == null; i++)
            if('c' + classes[i].codigo == proc)
                status = classes[i].status
    }

    return status
}

function filterProcs(processos, classesI){
    var procs = []

    for(var i = 0; i < processos.length; i++){
        var status = searchClasse(processos[i].procId, classesI)

        if(status == "A")
            procs.push(JSON.parse(JSON.stringify(processos[i])))
    }

    return procs
}

function filterJusts(justificacao, classesI){
    var justs = []

    for(var j = 0; j < justificacao.length; j++){
        var just = JSON.parse(JSON.stringify(justificacao[j]))
        just.processos = filterProcs(justificacao[j].processos, classesI)
        justs.push(just)
    }

    return justs
}

function filterClasses(classes, classesI){
    var ret = []

    for(var i = 0; i < classes.length; i++){
        if(classes[i].status == "A"){
            var classe = JSON.parse(JSON.stringify(classes[i]))

            if(classes[i].filhos)
                classe.filhos = filterClasses(classes[i].filhos, classesI)

            if(classes[i].processosRelacionados)
                classe.processosRelacionados = filterClasses(classes[i].processosRelacionados, classesI)

            if(classes[i].pca && classes[i].pca.justificacao)
                classe.pca.justificacao = filterJusts(classes[i].pca.justificacao, classesI)

            if(classes[i].df && classes[i].df.justificacao)
                classe.df.justificacao = filterJusts(classes[i].df.justificacao, classesI)

            ret.push(classe)
        }
    }

    return ret
}

module.exports.outputFormat = async (req, res, next) => {
	if (res.locals.dados) {
	    const outF = req.query.fs || req.headers.accept

        if(res.locals.tipo == "classes"){
            var isEsqueleto = "info" in req.query && req.query.info == "esqueleto"

            //se não for utilizador ou se for com nível inferior a 3.5 ou ainda se for o esqueleto para a criação de uma TS
            if(res.locals.idType != "User" || req.user.level < 3.5 || isEsqueleto){
                res.locals.dados = filterClasses(res.locals.dados, res.locals.dados)
            }

            // remove o status do esqueleto
            if(isEsqueleto){
                for(var i=0; i < res.locals.dados.length; i++){
                    delete res.locals.dados[i].status
                }
            }
        }

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
