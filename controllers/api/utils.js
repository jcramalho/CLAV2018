var axios = require('axios')
var fs = require('fs')
const urlGraphDB = require('../../config/database').onthology
const prefixes = require('../../config/database').prefixes

//Define cabeçalho e extensão do ficheiro de saída
function getAcceptExtension(format){
    var accept
    var extension

    switch(format){
        case 'text/turtle':
        case "turtle":
            accept = 'text/turtle'
            extension = 'ttl'
            break
        case 'application/ld+json':
        case "json-ld":
            accept = 'application/ld+json'
            extension = 'jsonld'
            break
        case 'application/rdf+xml':
        case "rdf-xml":
            accept = 'application/rdf+xml'
            extension = 'rdf'
            break
        default:
            accept = 'text/turtle'
            extension = 'ttl'
            break
    }

    return [accept, extension]
}

//Simplifica um objeto Date devolvendo apenas a data no formato yyyy-mm-dd
function stringifyDate(date){
    var d = String(date.getDate()).padStart(2, '0')
    var m = String(date.getMonth() + 1).padStart(2, '0')
    var y = date.getFullYear()
    var ret = y + '-' + m + '-' + d

    return ret
}

//Obtém a data atual
function currentDate(){
    var today = new Date()
    return stringifyDate(today)
}

//Obtém a data atual menos nDays days
function currentDateMinusDays(nDays){
    var prevDate = new Date(new Date().setDate(new Date().getDate()-nDays))
    return stringifyDate(prevDate)
}

//Obtém da lista a string que termina com o parametro string
function fileEndsWith(files, eW){
    var file

    files.forEach(f => {
        if(f.endsWith(eW)){
            file = f
        }
    })

    return file
}

/**
 * Exporta todos os triplos do repositório, caso já exista uma exportação realizada nos days anteriores à qual é feito o pedido de exportação apenas devolve o ficheiro dessa exportação, caso contrário faz um novo export do graphDB
 * @param infer se false não obtém os triplos inferidos se true obtém os triplos inferidos
 * @param format formato de saida da exportação. Pode ser turtle, json-ld ou rdf-xml
 * @param days número de dias em os ficheiros não são atualizados, valor inteiro maior ou igual a 0
 */
exports.exportRDF = async function(infer, format, days){
    var url = urlGraphDB + "/statements?infer="
    var response
    var ae = getAcceptExtension(format)
    var accept = ae[0]
    var extension = ae[1]
    
    var headers = {
        headers: {
            'Accept': accept
        }
    }

    switch(infer){
        case "true":
            break
        default:
            infer = "false"
            break
    }
    
    try{
        var files = fs.readdirSync('./public/rdf')
    }catch(erro){
        throw(erro)
    }

    var date = currentDate()
    var prevDate = currentDateMinusDays(days)

    var endsWith = '-' + infer + '.' + extension
    var findedFile = fileEndsWith(files, endsWith)
    var findedDate

    if(findedFile){
        findedDate = findedFile.split('clav-')[1]
        findedDate = findedDate.split(endsWith)[0]
    }

    if(findedDate && Date.parse(prevDate) < Date.parse(findedDate)){
        try{
            var fileContent = fs.readFileSync('./public/rdf/' + findedFile)
        }catch(erro){
            throw(erro)
        }

        return [fileContent, accept]
    }else{
        try{
            response = await axios.get(url + infer, headers)
            
            if(findedFile){
                fs.unlinkSync('./public/rdf/' + findedFile)
            }

            var dados
            if(extension == 'jsonld'){
                dados = JSON.stringify(response.data, null, 4)
            }else{
                dados = response.data
            }
            
            var file = 'clav-' + date + endsWith
            fs.writeFileSync('./public/rdf/' + file, dados)
        }catch(error){
            throw(error)
        }
        
        return [dados, accept]
    }
}

/**
 * Executa uma query SPARQL e devolve o resultado
 * @param method Define se é uma SPARQL Query ou uma SPARQL Update
 * @param query a query a executar
 */
exports.execQuery = async function(method, query){
    var getLink = urlGraphDB + "?query="
    var postLink = urlGraphDB + "/statements"
    var encoded = encodeURIComponent(prefixes + query)
    var response
    try{
        switch(method) {
            case "query":
                response = await axios.get(getLink + encoded)
                break;
            case "update":
                response = await axios.post(postLink, `update=${encoded}`)
                break;
            default:
                response = await axios.get(getLink + encoded)
                break;
        }
        return response.data
    }catch(error){
        throw(error)
    }
}

/**
 * Normaliza e simplifica os resultados de uma query SPARQL.
 * 
 * @example
 * response = {  
 *   head: { vars: ["sigla", "designacao", "estado", "internacional"] },
 *   results: {
 *     bindings: [{  
 *       estado:{ type: "literal", value:"Ativa" },
 *       sigla: { type:"literal", value:"AR" },
 *       designacao: { type:"literal", value:"Assembeia da República" },
 *       internacional: { type:"literal", value:"Não" }
 *     }]
 *   }
 * }
 * 
 * // O resultado da normalização da resposta acima será:
 * [{ estado: "Ativa", sigla: "PGR", designacao:"Assembleia da República", internacional:"Não" }]
 * 
 * @param response objeto de resposta da query SPARQL
 * @return objeto normalizado e simplificado
 */
exports.normalize = function(response) {
    return response.results.bindings.map(obj =>
        Object.entries(obj)
            .reduce((new_obj, [k,v]) => (new_obj[k] = v.value, new_obj),
                    new Object()));
};

/**
 * Normaliza e simplifica os resultados de uma query SPARQL mantendo a ordem das variáveis da query SPARQL.
 * 
 * @example
 * response = {  
 *   head: { vars: ["sigla", "designacao", "estado", "internacional"] },
 *   results: {
 *     bindings: [{  
 *       estado:{ type: "literal", value:"Ativa" },
 *       sigla: { type:"literal", value:"AR" },
 *       designacao: { type:"literal", value:"Assembeia da República" },
 *       internacional: { type:"literal", value:"Não" }
 *     }]
 *   }
 * }
 * 
 * // O resultado da normalização da resposta acima será:
 * [{ sigla: "PGR", designacao:"Assembleia da República", estado: "Ativa", internacional:"Não" }]
 * 
 * @param response objeto de resposta da query SPARQL
 * @return objeto normalizado e simplificado (ordenado)
 */
exports.normalizeOrdered = function(response) {
    var out = []
    
    response.results.bindings.forEach(e => {
        var outE = {}
        response.head.vars.forEach( v => {
            if(e[v])
                outE[v] = e[v].value
        })
        out.push(outE)
    })

    return out
};

/**
 * Efetua uma projeção sobre uma lista de objetos.
 * 
 * @example
 * objs = [
 *  { sigla: "AR", designacao: "Assembleia da República", legislacao: "leg_1" },
 *  { sigla: "AR", designacao: "Assembleia da República", legislacao: "leg_2" },
 *  { sigla: "CEE", designacao: "Comunidade Económica Europeia", legislacao: "leg_1" },
 *  { sigla: "DGAV", designacao: "Direção Geral de Alimentação e Veterinária" } 
 * ];
 * projection(objs, ["sigla", "designacao"], ["legislacao"]) === [
 *  { sigla: "AR", designacao: "Assembleia da República", legislacao: ["leg_1","leg_2"] },
 *  { sigla: "CEE", designacao: "Comunidade Económica Europeia", legislacao: ["leg_1"] },
 *  { sigla :"DGAV", designacao: "Direção Geral de Alimentação e Veterinária", legislacao:[]}
 * ];
 * 
 * @param {[Object]} objs lista de objetos 
 * @param {[string]} fields lista de campos sobre os quais se fará a projeção
 * @param {[string]} group lista de campos a agrupar
 * @return lista de objetos com os campos selecionados da projeção
 */
exports.projection = function(objs, fields, group) {
    let result = new Map();
    for (obj of objs) {
        const proj = JSON.stringify(fields.reduce((new_obj, col) => Object.defineProperty(new_obj, col, {
            value: obj[col],
            enumerable: !0
        }), new Object()));
        let g = {};
        if (result.has(proj)) {
            g = Object.entries(result.get(proj)).reduce((new_obj, [k, v]) => Object.defineProperty(new_obj, k, {
                value: (v.push(obj[k]), v),
                enumerable: !0
            }), new Object())
        } else {
            g = group.reduce((new_obj, k) => Object.defineProperty(new_obj, k, {
                value: obj[k] ? [obj[k]] : [],
                enumerable: !0
            }), new Object())
        }
        result.set(proj, g)
    }
    return Array.from(result.entries()).map(([x, y]) => Object.assign(JSON.parse(x), y))
}
