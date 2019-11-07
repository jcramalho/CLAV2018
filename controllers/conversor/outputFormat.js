const { json2xml } = require('./json2xml.js')
const { json2csv } = require('./json2csv.js')
const request = require('./../api/utils.js').request
var Entidades = require('./../api/entidades.js')
var Tipologias = require('./../api/tipologias.js')

const notSup = "Esta rota não suporta exportação para CSV. Contudo pode exportar para JSON (application/json ou json) ou XML (application/xml ou xml) nesta rota."

//Obtém o resto da info da Entidade/Tipologia para exportar para CSV
async function getAllObjectInfo(req, obj, type){
    var baseURL
    var response

    if(type == "entidade"){
        baseURL = '/api/entidades/ent_' + obj.sigla
    }else if(type == "tipologia"){
        baseURL = '/api/tipologias/tip_' + obj.sigla
    }

    if (type == "entidade") {
        response = await request.get(req, baseURL + '/tipologias')
        obj.tipologias = response.data
    }

    response = await request.get(req, baseURL + '/intervencao/dono')
    obj.dono = response.data
    response = await request.get(req, baseURL + '/intervencao/participante')
    obj.participante = response.data
}

//Obtém o resto da info das Entidades para exportar para CSV
async function getAllEntidadesInfo(ents){
    //obtém as tipologias e os donos para todas as entidades
    var data = await Entidades.listarTipsDonos()
    var tipsDonos = []

    for(var i = 0; i < data.length; i++){
        tipsDonos[data[i].sigla] = {
            tipologias: data[i].tipologias,
            dono: data[i].dono
        }
    }

    //obtém os participantes e o tipo de participação para todas as entidades
    data = await Entidades.listarParticipantes()
    var parts = []

    for(i = 0; i < data.length; i++){
        parts[data[i].sigla] = {
            participante: data[i].participante,
            tipoPar: data[i].tipoPar
        }
    }

    for(i = 0; i < ents.length; i++){
        ents[i].tipologias = tipsDonos[ents[i].sigla].tipologias
        ents[i].dono = tipsDonos[ents[i].sigla].dono
        ents[i].participante = parts[ents[i].sigla].participante
        ents[i].tipoPar = parts[ents[i].sigla].tipoPar
    }
}

//Obtém o resto da info das Tipologias para exportar para CSV
async function getAllTipologiasInfo(tips){
    //obtém os donos para todas as entidades
    var data = await Tipologias.listarDonos()
    var donos = []

    for(var i = 0; i < data.length; i++){
        donos[data[i].sigla] = {
            dono: data[i].dono
        }
    }

    //obtém os participantes e o tipo de participação para todas as entidades
    data = await Tipologias.listarParticipantes()
    var parts = []

    for(i = 0; i < data.length; i++){
        parts[data[i].sigla] = {
            participante: data[i].participante,
            tipoPar: data[i].tipoPar
        }
    }

    for(i = 0; i < tips.length; i++){
        tips[i].dono = donos[tips[i].sigla].dono
        tips[i].participante = parts[tips[i].sigla].participante
        tips[i].tipoPar = parts[tips[i].sigla].tipoPar
    }
}

module.exports.outputFormat = async (req, res, next) => {
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
            case 'excel/csv':
            case 'csv':
                if(res.locals.tipo){
                    try{
                        switch(res.locals.tipo){
                            case "entidade":
                                await getAllObjectInfo(req, res.locals.dados, res.locals.tipo)
                                break
                            case "entidades":
                                await getAllEntidadesInfo(res.locals.dados)
                                break
                            case "tipologia":
                                await getAllObjectInfo(req, res.locals.dados, res.locals.tipo)
                                break
                            case "tipologias":
                                await getAllTipologiasInfo(res.locals.dados)
                                break
                            default:
                                break
                        }

                        res.setHeader('content-type', 'text/csv')
                        var csv = json2csv(res.locals.dados, res.locals.tipo)
                        if(outF == 'excel/csv'){
                            csv = csv.replace(/#\n/g,"#")
                        }
                        res.send(csv)
                    }catch(e){
                        res.status(406).send(notSup)
                    }
                }else{
                    res.status(406).send(notSup)
                }
                break
            default:
                res.json(res.locals.dados)
                break
        }
    }
}
