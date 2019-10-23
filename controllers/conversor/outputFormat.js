const { json2xml } = require('./json2xml.js')
const { json2csv } = require('./json2csv.js')
const request = require('./../api/utils.js').request
var Entidades = require('./../api/entidades.js')

const notSup = "Esta rota não suporta exportação para CSV. Contudo pode exportar para JSON (application/json ou json) ou XML (application/xml ou xml) nesta rota."

//Obtém o resto da info da Entidade para exportar para CSV
async function getAllEntidadeInfo (req, ent) {
    var baseURL = '/api/entidades/ent_' + ent.sigla
    var response

    response = await request.get(req, baseURL + '/tipologias')
    ent.tipologias = response.data
    response = await request.get(req, baseURL + '/intervencao/dono')
    ent.dono = response.data
    response = await request.get(req, baseURL + '/intervencao/participante')
    ent.participante = response.data
}

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
            case 'csv':
                if(res.locals.tipo){
                    try{
                        switch(res.locals.tipo){
                            case "entidade":
                                await getAllEntidadeInfo(req, res.locals.dados)
                                break
                            case "entidades":
                                await getAllEntidadesInfo(res.locals.dados)
                                break
                            default:
                                break
                        }

                        res.setHeader('content-type', 'text/csv');
                        res.send(json2csv(res.locals.dados, res.locals.tipo))
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
