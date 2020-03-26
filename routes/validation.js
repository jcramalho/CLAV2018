const { check, param, query, body, header, cookie } = require('express-validator');

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

    try{
        return getLocation[location](field, msg).isIn(list)
    }catch(err){
        return check(field, msg).isIn(list)
    }
}

module.exports.comecaPor = function (location, field, starts){
    const msg = `Valor não começa por '${starts}'`

    try{
        return getLocation[location](field, msg).exists({checkFalsy: true}).custom(value => value.startsWith(starts))
    }catch(err){
        return check(field, msg).exists({checkFalsy: true}).custom(value => value.startsWith(starts))
    }
}
