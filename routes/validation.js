const { oneOf, check, param, query, body, header, cookie } = require('express-validator');
const { formats } = require("./outputFormat.js")
var Entidades = require("../controllers/api/entidades.js");
var Tipologias = require("../controllers/api/tipologias.js");

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

module.exports.estaEm = function (location, field, list){
    var strList = list.map(v => "'" + v + "'")
    strList = (list.length > 1 ? strList.slice(0, -1).join(", ") + ' e ' : "") + strList.slice(-1)
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

module.exports.verificaClasseId = function(location, field){
    return module.exports.comecaPorEMatch(
        location,
        field,
        'c',
        '^c\\d{3}(\\.\\d{2}(\\.\\d{3}(\\.\\d{2})?)?)?$'
    )
}

module.exports.verificaClasseCodigo = function(location, field){
    const regex = "^\\d{3}(\\.\\d{2}(\\.\\d{3}(\\.\\d{2})?)?)?$"
    const msg = `Formato Inválido. Não respeita o regex: '${regex}'`

    return module.exports.existe(location, field)
        .bail()
        .matches(new RegExp(regex))
        .withMessage(msg)
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

//Valida o id de um possível AE
module.exports.verificaAEId = function (location, field){
    return module.exports.comecaPorEMatch(location, field, 'ae_', '^ae_.+$')
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

//Valida o formato de saida de classes, entidades, tipologias e legislação
module.exports.eFS = function(){
    return oneOf([
        module.exports.estaEm('query', 'fs', formats).optional(),
        module.exports.estaEm('header', 'accept', formats).optional()
    ])
}
