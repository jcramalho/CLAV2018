const { oneOf, check, param, query, body, header, cookie } = require('express-validator');
var Entidades = require("../controllers/api/entidades.js");
var Tipologias = require("../controllers/api/tipologias.js");
var State = require("../controllers/state.js");
const execQuery = require("../controllers/api/utils").execQuery;

const getLocation = {
    'param': param,
    'query': query,
    'body': body,
    'header': header,
    'cookie': cookie
}

module.exports.existe = function (location, field){
    const msg = 'Valor é undefined, null ou vazio'

    try{
        return getLocation[location](field, msg).exists({checkFalsy: true})
    }catch(err){
        return check(field, msg).exists({checkFalsy: true})
    }
}

module.exports.enumList = function(list){
    var strList = list.map(v => "'" + v + "'")
    var ret = list.length > 1 ? strList.slice(0, -1).join(", ") + ' e ' : ""
    ret += strList.slice(-1)
    return ret
}

module.exports.estaEm = function (location, field, list){
    var strList = module.exports.enumList(list)
    const msg = "Valor diferente de " + strList

    return module.exports.existe(location, field)
        .bail()
        .isIn(list)
        .withMessage(msg)
}

module.exports.comecaPor = function (location, field, starts){
    const msg = `Valor não começa por '${starts}'`

    return module.exports.existe(location, field)
        .bail()
        .custom(value => value.startsWith(starts))
        .withMessage(msg)
}

module.exports.comecaPorEMatch = function (location, field, starts, regex){
    const msg = `Formato Inválido. Não respeita o regex: '${regex}'`

    return module.exports.comecaPor(location, field, starts)
        .bail()
        .matches(new RegExp(regex))
        .withMessage(msg)
}

module.exports.existeEnt = async entId => {
    var entidades = await Entidades.listar("True")
    entidades = entidades.map(e => e.id)

    if(entidades.includes(entId)){
        return Promise.resolve()
    }else{
        return Promise.reject()
    }
}

module.exports.existeTip = async tipId => {
    var tipologias = await Tipologias.listar("True")
    tipologias = tipologias.map(e => e.id)

    if(tipologias.includes(tipId)){
        return Promise.resolve()
    }else{
        return Promise.reject()
    }
}

module.exports.existeClasse = async classeCodigo => {
    var classes = await State.getClassesFlatList()
    classes = classes.map(e => e.codigo)

    if(classes.includes(classeCodigo)){
        return Promise.resolve()
    }else{
        return Promise.reject()
    }
}

module.exports.verificaClasseId = function(location, field){
    return module.exports.comecaPorEMatch(
        location,
        field,
        'c',
        '^c\\d{3}(\\.\\d{2}(\\.\\d{3}(\\.\\d{2})?)?)?$'
    )
}

module.exports.match = function(location, field, regex){
    const msg = `Formato Inválido. Não respeita o regex: '${regex}'`

    return module.exports.existe(location, field)
        .bail()
        .matches(new RegExp(regex))
        .withMessage(msg)
}

module.exports.verificaClasseCodigo = function(location, field){
    const regex = "^\\d{3}(\\.\\d{2}(\\.\\d{3}(\\.\\d{2})?)?)?$"
    return module.exports.match(location, field, regex)
}

module.exports.verificaPedidoCodigo = function(location, field){
    const regex = "^\\d{4}-\\d+$"
    return module.exports.match(location, field, regex)
}

module.exports.verificaNumeroLeg = function(location, field){
    const regex = "^\\d+(-\\w)?\\/\\d+$"
    return module.exports.match(location, field, regex)
}

module.exports.verificaLegId = function(location, field){
    return module.exports.comecaPorEMatch(location, field, 'leg_', '^leg_.+$')
}

module.exports.verificaJustId = function(location, field){
    return module.exports.comecaPorEMatch(
        location,
        field,
        'just_',
        '^just_(df|pca)_c\\d{3}(\\.\\d{2}(\\.\\d{3}(\\.\\d{2})?)?)?$'
    )
}

//Valida o id de uma possível entidade
module.exports.verificaEntId = function (location, field){
    return module.exports.comecaPorEMatch(location, field, 'ent_', '^ent_.+$')
}

//Valida o id de uma possível tipologia
module.exports.verificaTipId = function (location, field){
    return module.exports.comecaPorEMatch(location, field, 'tip_', '^tip_.+$')
}

//Valida o id de um possível vocabulario
module.exports.verificaVCId = function (location, field){
    return module.exports.comecaPorEMatch(location, field, 'vc_', '^vc_.+$')
}

//Valida o id de um possível termo de um vocabulario
module.exports.verificaTermoVCId = function (location, field){
    return module.exports.comecaPorEMatch(location, field, 'vc_', '^vc_.+_.+$')
}

//valida e o id e verifica se a entidade existe na BD
module.exports.verificaExisteEnt = function(location, field){
    return module.exports.verificaEntId(location, field)
        .bail()
        .custom(module.exports.existeEnt)
        .withMessage("Entidade não existe na BD")
}

//valida e o id e verifica se a tipologia existe na BD
module.exports.verificaExisteTip = function(location, field){
    return module.exports.verificaTipId(location, field)
        .bail()
        .custom(module.exports.existeTip)
        .withMessage("Entidade não existe na BD")
}

//valida e o id e verifica se a classe existe na BD
module.exports.verificaExisteClasse = function(location, field){
    return module.exports.verificaClasseCodigo(location, field)
        .bail()
        .custom(module.exports.existeClasse)
        .withMessage("Classe não existe na BD")
}

//Valida o id de um possível AE
module.exports.verificaAEId = function (location, field){
    return module.exports.comecaPorEMatch(location, field, 'ae_', '^ae_.+$')
}

//Valida o id de uma possível TS
module.exports.verificaTSId = function (location, field){
    return module.exports.match(location, field, '^.+$')
}

//Valida um conjunto de ids de possiveis entidades
module.exports.verificaEnts = function (location, field){
    return module.exports.existe(location, field)
        .bail()
        .matches(/^ent_[^,]+(,ent_[^,]+)*$/)
        .withMessage("Valor inválido, exemplo: 'ent_AAN,ent_SEF'")
}

//Valida um conjunto de ids de possiveis tipologias
module.exports.verificaTips = function (location, field){
    return module.exports.existe(location, field)
        .bail()
        .matches(/^tip_[^,]+(,tip_[^,]+)*$/)
        .withMessage("Valor inválido, exemplo: 'tip_AAC,tip_AF'")
}

module.exports.verificaUserId = function(location, field){
    return oneOf([
        module.exports.eMongoId(location, field),
        module.exports.eNIC(location, field)
    ], `'${field}' é um Id do MongoDB ou um NIC`)
}

module.exports.dataValida = function (location, field){
    return module.exports.existe(location, field)
        .bail()
        .matches(/^\d{4}-\d{2}-\d{2}$/) //garante formato da data
        .withMessage("A data deve estar no formato: AAAA-MM-DD")
        .bail()
        .isISO8601({strict: true}) //garante formato(mais flexivel) e se a data é válida
        .withMessage("A data é inválida")
}

module.exports.existeDep = function (location, fieldDep){
    return function(v, {req}) {
        const loc = location + (location.slice(-1) == 'y' ? "" : "s")
        if(!req[loc][fieldDep]){
            return Promise.reject()
        }else{
            return Promise.resolve()
        }
    }
}

module.exports.verificaLista = function (location, field){
    return module.exports.existe(location, field)
        .bail()
        .isArray()
        .withMessage("Não é um array")
}

//Valida o formato de saida de classes, entidades, tipologias e legislação
module.exports.eFS = function(){
    return oneOf([
        module.exports.estaEm('query', 'fs', module.exports.vcFormats).optional(),
        module.exports.estaEm('header', 'accept', module.exports.vcFormats).optional()
    ], `O formato de saída deve ser colocado na query string 'fs' ou na header 'Accept'`)
}

module.exports.estaAtiva = async function(id){
    const tipo = id.split("_")[0]
    var rel = null
    switch(tipo){
        case "leg":
            rel = 'clav:diplomaEstado "Ativo"'
            break
        case "tip":
            rel = 'clav:tipEstado "Ativa"'
            break
        case "ent":
            rel = 'clav:entEstado "Ativa"'
            break
        default:
            break
    }

    if(rel){
        const query = `ASK {
            clav:${id} ${rel}
        }`

        res = await execQuery("query", query)
        if(res.boolean){
            return Promise.resolve()
        }else{
            return Promise.reject()
        }
    }else{
        return Promise.reject()
    }
}

module.exports.eMongoId = function(location, field){
    return module.exports.existe(location, field)
        .bail()
        .isMongoId()
        .withMessage("Formato do id inválido")
}

module.exports.eNIC = function(location, field){
    return module.exports.match(location, field, '^[0-9]{7,}$')
}

//Vocabulários
module.exports.vcBoolean = ["Sim", "Não"]
module.exports.vcEstado = ["Ativa", "Harmonização", "Inativa"]
module.exports.vcFonte = ["PGD", "PGD/LC", "RADA"]

//aggregateLogs e logs
module.exports.vcTipoUser = ['User', 'Chave', 'Desconhecido']
module.exports.vcVerbo = ['GET', 'POST', 'PUT', 'DELETE']

//autosEliminacao
module.exports.vcTipoAE = ["PGD", "RADA", "PGD_LC"]

//classes
module.exports.vcClassesInfo = ['completa', 'esqueleto', 'pesquisa']
module.exports.vcClassesStruct = ['arvore', 'lista']
module.exports.vcClassesTipo = ['comum', 'especifico']
module.exports.vcClassesNiveis = ["1", "2", "3", "4"]
module.exports.vcClasseInfo = ["subarvore"]
module.exports.vcClassesRels = ["eAntecessorDe", "eComplementarDe", "eCruzadoCom", "eSinteseDe", "eSintetizadoPor", "eSucessorDe", "eSuplementoPara", "eSuplementoDe"]

//Entidades
module.exports.vcEntsProcs = ["com", "sem"]
module.exports.vcEntsInfo = ["completa"]

//Indicadores
module.exports.vcIndicRels = ["temRelProc", "eAntecessorDe", "eSucessorDe", "eComplementarDe", "eCruzadoCom", "eSinteseDe", "eSintetizadoPor", "eSuplementoDe", "eSuplementoPara", "dono", "participante", "temLeg"]
module.exports.vcIndicCrits = ["legal", "gestionario", "utilidadeAdministrativa", "densidadeInfo", "complementaridadeInfo"]
module.exports.vcIndicDfs = ["C", "CP", "E"]

//Legislacao
module.exports.vcLegTipo = ["Decreto", "DL", "Lei", "Diretiva", "Circular", "Despacho", "Decreto Regulamentar", "Portaria", "Decreto do Governo", "Decreto Legislativo Regional", "Resolução do Conselho de Ministros", "Despacho Normativo", "Resolução da Assembleia da República", "Decisão", "Regulamento", "Decreto do Presidente da República", "Aviso", "Despacho Conjunto", "Lei Orgânica", "Decisão-Quadro", "Circular Normativa", "Recomendação", "Deliberação", "Circular Informativa", "Lei Constitucional", "CSN EN", "Declaração de Retificação", "ISO", "NP", "Diretiva Técnica", "Comunicação", "Resolução", "Tratado", "Regulamento de Execução", "NP EN ISO/IEC", "NOP", "ILAC", "Regulamento Delegado", "NP EN ISO", "Ordem de Serviço", "Estatuto", "Instrução", "ISO/IEC"]
module.exports.vcLegEstado = ["Ativo", "Revogado"]
module.exports.vcLegProcs = ["com", "sem"]
module.exports.vcLegInfo = ["completa"]

//Noticias
module.exports.vcNotRec = ["sim"]

//Ontologia
module.exports.vcOntoFormats = [
    "text/turtle",
    "turtle",
    "application/ld+json",
    "json-ld",
    "application/rdf+xml",
    "rdf-xml"
]

//Pedidos
module.exports.vcPedidoTipo = [
    "Classe",
    "TS Organizacional",
    "TS Pluriorganizacional",
    "TS Pluriorganizacional web",
    "Entidade",
    "Tipologia",
    "Legislação",
    "Termo de Indice",
    "Auto de Eliminação",
    "AE PGD/LC",
    "AE PGD",
    "AE RADA",
    "RADA"
]
module.exports.vcPedidoAcao = ["Criação", "Alteração", "Remoção", "Importação", "Extinção"]
module.exports.vcPedidoEstado = ["Submetido", "Distribuído", "Apreciado", "Validado", "Devolvido"]

//Pendentes
module.exports.vcPendenteTipo = [
    "Classe",
    "TS Organizacional",
    "TS Pluriorganizacional",
    "Entidade",
    "Tipologia",
    "Legislação",
    "Termo de Indice",
    "Auto de Eliminação",
    "RADA"
]
module.exports.vcPendenteAcao = ["Criação", "Alteração", "Remoção"]

//Tipologias
module.exports.vcTipsInfo = ["completa"]


//Users
module.exports.vcUserLevels = [1, 2, 3, 3.5, 4, 5, 6, 7]
module.exports.vcUsersFormato = ["normalizado"]

//OutputFormat
module.exports.vcFormats = [
    'application/json',
    'json',
    'application/xml',
    'xml',
    'text/csv',
    'excel/csv',
    'csv'
]
