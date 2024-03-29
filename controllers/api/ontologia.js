const execQuery = require('../../controllers/api/utils').execQuery
const urlGraphDB = require('../../config/database').onthology
var fs = require('fs')
var axios = require('axios')
const Ontologia = module.exports

Ontologia.data = async () => {
    const query = `PREFIX dc: <http://purl.org/dc/elements/1.1#>
        select ?d where {
            <http://jcr.di.uminho.pt/m51-clav> dc:date ?d .
        }`

    try{
        var res = await execQuery("query", query)
        return res.results.bindings[0].d.value 
    }catch(erro) {
        throw (erro) 
    }
}

Ontologia.descricao = async () => {
    const query = `select ?d where {
            <http://jcr.di.uminho.pt/m51-clav> rdfs:comment ?d .
        }`

    try{
        var res = await execQuery("query", query)
        return res.results.bindings[0].d.value 
    }catch(erro) {
        throw (erro) 
    }
}

//Define cabeçalho e extensão do ficheiro de saída
function getAcceptExtension(format){
    var accept
    var extension

    switch(format){
        case 'text/turtle':
            accept = 'text/turtle'
            extension = 'ttl'
            break
        case 'application/ld+json':
            accept = 'application/ld+json'
            extension = 'jsonld'
            break
        case 'application/rdf+xml':
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

//Obtém da lista a string que termina com eW
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
Ontologia.exportar = async function(infer, format, days){
    var url = urlGraphDB + "/statements?infer="
    var folder = './public/ontologia/'
    var path
    var ae = getAcceptExtension(format)
    var accept = ae[0]
    var extension = ae[1]

    switch(infer){
        case "true":
            break
        default:
            infer = "false"
            break
    }

    try{
        var files = fs.readdirSync(folder)
    }catch(erro){
        throw(erro)
    }

    var prevDate = currentDateMinusDays(days)

    var endsWith = '-' + infer + '.' + extension
    var findedFile = fileEndsWith(files, endsWith)
    var findedDate

    if(findedFile){
        findedDate = findedFile.split('clav-')[1]
        findedDate = findedDate.split(endsWith)[0]
    }

    if(findedDate && Date.parse(prevDate) < Date.parse(findedDate)){
        path = folder + findedFile
        return [path, extension]
    }else{
        try{
            var response = await axios.get(url + infer, {
                headers: {
                    'Accept': accept
                }
            })

            if(findedFile){
                fs.unlinkSync(folder + findedFile)
            }

            var dados
            if(extension == 'jsonld'){
                dados = JSON.stringify(response.data, null, 4)
            }else{
                dados = response.data
            }

            var date = currentDate()
            var file = 'clav-' + date + endsWith
            path = folder + file
            fs.writeFileSync(path, dados)
        }catch(error){
            throw(error)
        }

        return [path, extension]
    }
}

//Atualiza data da ultima alteração
Ontologia.atualizaData = async function() {
    try{
        var date = await Ontologia.data()
    }catch(erro){
        throw(erro)
    }

    var cDate = currentDate()
    if(date != cDate){
        const deleteQuery = `DELETE DATA {
            <http://jcr.di.uminho.pt/m51-clav> <http://purl.org/dc/elements/1.1#date> "${date}" .
        }`
        const insertQuery = `INSERT DATA {
            <http://jcr.di.uminho.pt/m51-clav> <http://purl.org/dc/elements/1.1#date> "${cDate}" .
        }`

        try{
            await execQuery("update", deleteQuery)
            await execQuery("update", insertQuery)
        }catch(erro){
            throw(erro)
        }

        return "Data atualizada com sucesso"
    }else{
        return "Data já está atualizada"
    }
}

//Executa uma query
Ontologia.executa = async function(query){
    var isUpdate = query.match(/\b(insert|delete|load|clear|create|drop)\b/ig)
    var isQuery = query.match(/\b(select|ask|construct|describe)\b/ig)

    if(isQuery){
        return await execQuery("query", query)
    }else if(isUpdate){
        return await execQuery("update", query)
    }else{
        throw "Não foi possível identificar o tipo da query"
    }
}
