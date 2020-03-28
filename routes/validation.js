const { oneOf, check, param, query, body, header, cookie } = require('express-validator');
const { formats } = require("./outputFormat.js")
var Entidades = require("../controllers/api/entidades.js");

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
    strList = strList.slice(0, -1).join(", ") + ' e ' + strList.slice(-1)
    const msg = "Valor diferente de " + strList

    return module.exports.existe(location, field)
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

module.exports.existeEnt = async entId => {
    var entidades = await Entidades.listar("True")
    entidades = entidades.map(e => e.id)

    if(entidades.includes(entId)){
        return Promise.resolve()
    }else{
        return Promise.reject()
    }
}

module.exports.eFS = function(){
    return oneOf([
        module.exports.estaEm('query', 'fs', formats).optional(),
        module.exports.estaEm('header', 'accept', formats).optional()
    ])
}
