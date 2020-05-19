//CSV separator to use
const separator = ';'
//Entity types that is possible to convert to CSV
const types = ["classes", "classe", "pesquisaClasses", "entidades", "entidade", "tipologias", "tipologia",  "legislacoes", "legislacao"]
//How is converted each field of each entities, format:
// entity : {
//      field: [title_to_use, func_to_aplicate to field value],
//      ...
// }
const convert_to = {
    "classe": {
        "codigo": ["Código", v => v],
        "titulo": ["Título", v => v],
        "descricao": ["Descrição", v => v],
        "notasAp": ["Notas de aplicação", map_value("nota")],
        "exemplosNotasAp": ["Exemplos de NA", map_value("exemplo")],
        "notasEx": ["Notas de exclusão", map_value("nota")],
        "termosInd": ["Termos Indice", map_value("termo")],
        "tipoProc": ["Tipo de processo", v => v],
        "procTrans": ["Processo transversal (S/N)", v => v],
        "dono": ["Dono", v => v], //caso do esqueleto
        "participante": ["Participante", v => v], //caso do esqueleto
        "donos": ["Donos do processo", map_value("sigla")],
        "participantes_sigla": ["Participante no processo", map_value("sigla")],
        "participantes_participLabel": ["Tipo de intervenção do participante", map_value("participLabel")],
        "processosRelacionados_codigo": ["Código do processo relacionado", map_value("codigo")],
        "processosRelacionados_titulo": ["Título do processo relacionado", map_value("titulo")],
        "processosRelacionados_idRel": ["Tipo de relação entre processos", map_value("idRel")],
        "legislacao_idLeg": ["Diplomas jurídico-administrativos REF Ids", map_value("idLeg")],
        "legislacao_titulos": ["Diplomas jurídico-administrativos REF Títulos", leg_titulos],
        "pca": ["", pca_df("pca")],
        "df": ["", pca_df("df")],
        "filhos": [null, filhos("classe")]
    },
    "pesquisaClasse": {
        "id": ["Código", v => v],
        "titulo": ["Título", v => v],
        "tp": ["Tipo de processo", v => v],
        "pt": ["Processo transversal (S/N)", v => v],
        "na": ["Notas de aplicação", v => v],
        "exemploNa": ["Exemplos de NA", v => v],
        "ne": ["Notas de exclusão", v => v],
        "ti": ["Termos Indice", v => v],
        "pca": ["Prazo de conservação administrativa", v => v],
        "fc_pca": ["Forma de contagem do PCA", v => v],
        "sfc_pca": ["Sub Forma de contagem do PCA", v => v],
        "crit_pca": ["Critério PCA", join],
        "df": ["Destino final", destino_final],
        "crit_df": ["Critério DF", join],
        "donos": ["Donos do processo", join],
        "participantes": ["Participantes do processo", join],
        "filhos": [null, filhos("pesquisaClasse")]
    },
    "entidade": {
        "sigla": ["Sigla", v => v],
        "designacao": ["Designação", v => v],
        "estado": ["Estado", v => v],
        "sioe": ["ID SIOE", v => v],
        "internacional": ["Internacional", internacional],
        "dono": ["Dono no processo", map_value("codigo")],
        "participante_codigo": ["Participante no processo", map_value("codigo")],
        "participante_tipoPar": ["Tipo de intervenção no processo", map_value("tipoPar")],
        "tipologias": ["Tipologias da entidade", map_value("sigla")]
    },
    "tipologia": {
        "sigla": ["Sigla", v => v],
        "designacao": ["Designação", v => v],
        "estado": ["Estado", v => v],
        "entidades": ["Entidades da tipologia", map_value("sigla")],
        "dono": ["Dono no processo", map_value("codigo")],
        "participante_codigo": ["Participante no processo", map_value("codigo")],
        "participante_tipoPar": ["Tipo de intervenção no processo", map_value("tipoPar")]
    },
    "legislacao": {
        "tipo": ["Tipo", v => v],
        "numero": ["Número", v => v],
        "data": ["Data", v => v],
        "sumario": ["Sumário", v => v],
        "fonte": ["Fonte", v => v],
        "link": ["Link", v => v],
        "entidades": ["Entidades", map_value("sigla")],
        "regula": ["Regula processo", map_value("codigo")]
    },
    "pca": {
        "valores": ["Prazo de conservação administrativa", v => v],
        "notas": ["Nota ao PCA", v => v],
        "formaContagem": ["Forma de contagem do PCA", v => v],
        "subFormaContagem": ["Sub Forma de contagem do PCA", v => v],
        "justificacao_criterio": ["Critério PCA", map_value("tipoId")],
        "justificacao_refs": ["ProcRefs/LegRefs PCA", refs]
    },
    "df": {
        "valor": ["Destino final", destino_final],
        "notas": ["Notas ao DF", v => v],
        "justificacao_criterio": ["Critério DF", map_value("tipoId")],
        "justificacao_refs": ["ProcRefs/LegRefs DF", refs]
    }
}

//convert internacional field
function internacional(value){
    if(value == "Sim")
        return "Sim"
    else
        return "Não"
}

//join elements that should be in the same csv "square"
function join(array){
    return array.join('#\n')
}

//convert array where we only need one field from each object element
function map_value(key){
    return function(value){
        return join(value.map(p => p[key]))
    }
}

//obtain legislacao title
function leg_titulos(value){
    return join(value.map(l => l.tipo + ' ' + l.numero))
}

//if DF is equal to "NE" should be empty
function destino_final(value){
    if(value == "NE")
        value = ""

    return value 
}

//get legislacao references (processos references e legislacao references)
function refs(value){
    var procs_legs = []

    value.forEach(just => {
        if(just.processos.length > 0)
            procs_legs.push('(' + join(just.processos.map(p => p.procId)) + ')')
        else if(just.legislacao.length > 0)
            procs_legs.push('(' + join(just.legislacao.map(l => l.legId)) + ')')
        else
            procs_legs.push('()')
    })

    return join(procs_legs)
}

//parse PCA or DF according to the key ("pca" or "df")
function pca_df(key){
    return function(value){
        var csvLines = [[], []]

        if(typeof value == "string"){ //caso do esqueleto
            csvLines[0].push(protect(key.toUpperCase()))
            csvLines[1].push(protect(value))
        }else
            csvLines = convertOne(value, key)

        return csvLines
    }
}

//parse filhos (children) of a classe
function filhos(type){
    return function(value){
        var csvLines = []

        value.forEach(classe => {
            var aux = convertOne(classe, type)
            aux.splice(0, 1)
            csvLines = csvLines.concat(aux)
        })

        return csvLines
    }
}

//protect value to put in CSV
function protect(string){
    if(string != null){
        if(typeof string === 'string')
            string = string.replace(/"/g,'""')
        return '"' + string + '"'
    }else
        return '""'
}

//build a final string
function joinLines(csvLines){
    for(var i = 0; i < csvLines.length; i++)
        csvLines[i] = csvLines[i].join(separator)

    return csvLines.join('\n')
}

//Convert one object of type
function convertOne(json, type){
    var csvLines = [[],[]]

    for(var key in convert_to[type]){
        var k = key.split('_')[0]
        var header = convert_to[type][key][0]

        if(k in json){
            var f = convert_to[type][key][1]
            var value = f(json[k])

            if(header == null){
                csvLines = csvLines.concat(value)
            }else if(header == ""){
                csvLines[0] = csvLines[0].concat(value[0])
                csvLines[1] = csvLines[1].concat(value[1])
            }else{
                csvLines[0].push(protect(header))
                csvLines[1].push(protect(value))
            }
        }else if(type == "pca" || type == "df" || k == "fonte"){
            csvLines[0].push(protect(header))
            csvLines[1].push(protect(""))
        }
    }

    return csvLines
}

//convert list objects of type
function convertAll(json, type){
    var csvLines = []
    var len = json.length

    if(len > 0){
        csvLines = convertOne(json[0], type)

        for(var i = 1; i < len; i++){
            var aux = convertOne(json[i], type)
            aux.splice(0, 1)
            csvLines = csvLines.concat(aux)
        }
    }

    return csvLines
}

module.exports.json2csv = (json, type) => {
    var csvLines

    //o tipo é válido?
    if(types.includes(type)){
        //lista ou apenas um elemento?
        if(type.slice(-1) == "s"){
            type = type.slice(0, -1)

            if(type == "legislacoe"){
                type = "legislacao"
            }

            csvLines = convertAll(json, type)
        }else{
            csvLines = convertOne(json, type)
        }
    }else{
        throw("Não é possível exportar para CSV nesta rota...")
    }

    return joinLines(csvLines)
}
