var fs = require('fs')
const Parametros = module.exports

var parametrosFile = './config/parametros.json'
var parametros = JSON.parse(fs.readFileSync(parametrosFile))

Parametros.setParameter = function (key, value) {
    parametros[key].valor = value
    fs.unlinkSync(parametrosFile)
    const dados = JSON.stringify(parametros, null, 4)
    fs.writeFileSync(parametrosFile, dados)
}

Parametros.getParameter = function (key) {
    return parametros[key]
}

Parametros.getParameters = function () {
    return parametros
}
