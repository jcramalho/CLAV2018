var separator = ';'

function protect(string){
    if(string != null){
        if(typeof string === 'string'){
            string = string.replace(/"/g,'""')
        }
        return '"' + string + '"'
    }else
        return '""'
}

function join(array){
    return array.join('#\n')
}

function joinLines(csvLines){
    var len = csvLines.length

    for(var i=0; i<len; i++){
        csvLines[i] = csvLines[i].join(separator)
    }

    var csv = csvLines.join('\n')
    return csv
}

function json2csvArray(array, key){
    var csv = []
    var titles = []
    var columns = [[]]

    switch(key){
        case 'notasAp':
            titles[0] = "Notas de aplicação"
        case 'notasEx':
            if(titles.length == 0) titles[0] = "Notas de exclusão"
            array.forEach(e => {
                columns[0].push(e.nota)
            })
            break
        case 'exemplosNotasAp':
            titles[0] = "Exemplos de NA"
            array.forEach(e => {
                columns[0].push(e.exemplo)
            })
            break
        case 'termosInd':
            titles[0] = "Termos Indice"
            array.forEach(e => {
                columns[0].push(e.termo)
            })
            break
        case 'participantes':
            titles[0] = "Participante no processo"
            titles[1] = "Tipo de intervenção do participante"
            columns[1] = []
            array.forEach(e => {
                columns[1].push(e.participLabel)
            })
        case 'donos':
            if(titles.length == 0) titles[0] = "Donos do processo"
            array.forEach(e => {
                columns[0].push(e.sigla)
            })
            break
        case 'processosRelacionados':
            titles[0] = "Código do processo relacionado"
            titles[1] = "Título do processo relacionado"
            titles[2] = "Tipo de relação entre processos"
            columns[1] = []
            columns[2] = []
            array.forEach(e => {
                columns[0].push(e.codigo)
                columns[1].push(e.titulo)
                columns[2].push(e.idRel)
            })
            break
        case 'legislacao':
            titles[0] = "Diplomas jurídico-administrativos REF Ids"
            titles[1] = "Diplomas jurídico-administrativos REF Títulos"
            columns[1] = []
            array.forEach(e => {
                columns[0].push(e.idLeg)
                columns[1].push(e.tipo + ' ' + e.numero)
            })
            break
        default:
            break
    }

    if(csv.length == 0){
        titles.forEach((t, index) => titles[index] = protect(t))
        columns.forEach((c, index) => columns[index] = protect(join(c)))
        csv = [titles, columns]
    }

    return csv
}

function addJustificacao(csvLines, json, key, k){
    var crits = []
    var procs_legs = []

    csvLines[0].push(protect('Critério ' + key.toUpperCase()))
    csvLines[0].push(protect('ProcRefs/LegRefs ' + key.toUpperCase()))

    json[key][k].forEach(just => {
        crits.push(just.tipoId)

        if(just.processos.length > 0){
            var ps = []
            just.processos.forEach(p => ps.push(p.procId))
            procs_legs.push('(' + join(ps) + ')')
        }else if(just.legislacao.length > 0){
            var ls = []
            just.legislacao.forEach(l => ls.push(l.legId))
            procs_legs.push('(' + join(ls) + ')')
        }else{
            procs_legs.push('()')
        }
    })

    csvLines[1].push(protect(join(crits)))
    csvLines[1].push(protect(join(procs_legs)))
}

function convertClasse(json){
    var csvLines = [[],[]]

    for(var key in json){
        if(json[key] instanceof Array){
            if(key == 'filhos'){
                json[key].forEach(classe => {
                    var aux = convertClasse(classe)
                    aux.splice(0, 1)
                    csvLines = csvLines.concat(aux)
                })
            }else{
                var aux = json2csvArray(json[key], key)
                csvLines[0] = csvLines[0].concat(aux[0])
                csvLines[1] = csvLines[1].concat(aux[1])
            }
        }else{
            switch(key){
                case 'pca':
                    csvLines[0].push("Prazo de conservação administrativa")
                    csvLines[0].push('Nota ao PCA')
                    csvLines[0].push('Forma de contagem do PCA')
                    csvLines[0].push('Sub Forma de contagem do PCA')

                    var index = csvLines[1].length
                    csvLines[1] = csvLines[1].concat(["", "", "", ""])

                    for(var k in json[key]){
                        if(k == 'valores'){
                            csvLines[1][index] = protect(json[key][k])
                        }else if(k == 'notas'){
                            csvLines[1][index + 1] = protect(json[key][k])
                        }else if(k == 'formaContagem'){
                            csvLines[1][index + 2] = protect(json[key][k])
                        }else if(k == 'subFormaContagem'){
                            csvLines[1][index + 3] = protect(json[key][k])
                        }else if(k == 'justificacao'){
                            addJustificacao(csvLines, json, key, k)
                        }
                    }
                    break
                case 'df':
                    csvLines[0].push("Destino final")
                    csvLines[0].push('Notas ao DF')

                    var index = csvLines[1].length
                    csvLines[1] = csvLines[1].concat(["", ""])

                    for(var k in json[key]){
                        if(k == 'valor'){
                            if(json[key][k] == "NE"){
                                csvLines[1][index] = protect("")
                            }else{
                                csvLines[1][index] = protect(json[key][k])
                            }
                        }else if(k == 'notas'){
                            csvLines[1][index + 1] = protect(json[key][k])
                        }else if(k == 'justificacao'){
                            addJustificacao(csvLines, json, key, k)
                        }
                    }
                    break
                case 'codigo':
                    csvLines[0].push(protect('Código'))
                    csvLines[1].push(protect(json[key]))
                    break
                case 'titulo':
                    csvLines[0].push(protect('Título'))
                    csvLines[1].push(protect(json[key]))
                    break
                case 'descricao':
                    csvLines[0].push(protect('Descrição'))
                    csvLines[1].push(protect(json[key]))
                    break
                case 'tipoProc':
                    csvLines[0].push(protect('Tipo de processo'))
                    csvLines[1].push(protect(json[key]))
                    break
                case 'procTrans':
                    csvLines[0].push(protect('Processo transversal (S/N)'))
                    csvLines[1].push(protect(json[key]))
                    break
                default:
                    break
            }
        }
    }
    
    return csvLines
}

function convertObject(json, type){
    var csvLines = [[],[]]
    
    csvLines[0].push(protect("Sigla"))
    csvLines[1].push(protect(json.sigla))

    csvLines[0].push(protect("Designação"))
    csvLines[1].push(protect(json.designacao))

    csvLines[0].push(protect("Estado"))
    csvLines[1].push(protect(json.estado))

    if(type == "entidade" || type == "entidades"){
        csvLines[0].push(protect("ID SIOE"))
        csvLines[1].push(protect(json.sioe))

        csvLines[0].push(protect("Internacional"))
        if(json.internacional == ""){
            csvLines[1].push(protect("Não"))
        }else{
            csvLines[1].push(protect("Sim"))
        }
    }

    csvLines[0].push(protect("Dono no processo"))
    if(json.dono instanceof Array){
        csvLines[1].push(protect(join(json.dono.map(p => p.codigo))))
    }else{
        csvLines[1].push(protect(json.dono))
    }

    csvLines[0].push(protect("Participante no processo"))
    if(json.dono instanceof Array){
        csvLines[1].push(protect(join(json.participante.map(p => p.codigo))))
    }else{
        csvLines[1].push(protect(json.participante))
    }

    csvLines[0].push(protect("Tipo de intervenção no processo"))
    if(json.dono instanceof Array){
    csvLines[1].push(protect(join(json.participante.map(p => p.tipoPar))))
    }else{
        csvLines[1].push(protect(json.tipoPar))
    }

    if(type == "entidade" || type == "entidades"){
        csvLines[0].push(protect("Tipologias da entidade"))
        if(json.dono instanceof Array){
            csvLines[1].push(protect(join(json.tipologias.map(t => t.sigla))))
        }else{
            csvLines[1].push(protect(json.tipologias))
        }
    }

    return csvLines
}

function convertLegislacao(json, type){
    var csvLines = [[],[]]
    
    csvLines[0].push(protect("Tipo"))
    csvLines[1].push(protect(json.tipo))

    csvLines[0].push(protect("Número"))
    csvLines[1].push(protect(json.numero))

    csvLines[0].push(protect("Data"))
    csvLines[1].push(protect(json.data))

    csvLines[0].push(protect("Sumário"))
    csvLines[1].push(protect(json.sumario))

    csvLines[0].push(protect("Link"))
    csvLines[1].push(protect(json.link))

    csvLines[0].push(protect("Entidades"))
    if(type == "legislacoes"){
        csvLines[1].push(protect(join(json.entidades.map(t => t.sigla))))
    }else if(type == "legislacao"){
        csvLines[1].push(protect(join(json.entidades)))
    }

    return csvLines
}

function convertObjects(json, convObj, type){
    var csvLines = []
    var len = json.length

    if(len > 0){
        csvLines = convObj(json[0], type)

        for(var i = 1; i < len; i++){
            var aux = convObj(json[i], type)
            aux.splice(0, 1)
            csvLines = csvLines.concat(aux)
        }
    }

    return csvLines
}

module.exports.json2csv = (json, type) => {
    var csv

    switch(type){
        case "classes":
            csvLines = convertObjects(json, convertClasse)
            break
        case "classe":
            csvLines = convertClasse(json)
            break
        case "entidades":
        case "tipologias":
            csvLines = convertObjects(json, convertObject, type)
            break
        case "entidade":
        case "tipologia":
            csvLines = convertObject(json, type)
            break
        case "legislacoes":
            csvLines = convertObjects(json, convertLegislacao, type)
            break
        case "legislacao":
            csvLines = convertLegislacao(json, type)
            break
        default:
            throw("Não é possível exportar para CSV nesta rota...")
            break
    }

    csv = joinLines(csvLines)
    return csv
}
