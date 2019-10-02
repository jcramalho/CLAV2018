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
                case 'df':
                    for(var k in json[key]){
                        if(k == 'justificacao'){
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
                        }else{
                            if(key == 'pca'){
                                if(k == 'valores' || k == 'valor'){
                                    csvLines[0].push(protect("Prazo de conservação administrativa"))
                                    csvLines[1].push(protect(json[key][k]))
                                }else if(k == 'notas'){
                                    csvLines[0].push(protect('Nota ao PCA'))
                                    csvLines[1].push(protect(json[key][k]))
                                }else if(k == 'formaContagem'){
                                    csvLines[0].push(protect('Forma de contagem do PCA'))
                                    csvLines[1].push(protect(json[key][k]))
                                }else if(k == 'subFormaContagem'){
                                    csvLines[0].push(protect('Sub Forma de contagem do PCA'))
                                    csvLines[1].push(protect(json[key][k]))
                                }
                            }else if(key == 'df'){
                                if(k == 'valor'){
                                    csvLines[0].push(protect("Destino final"))
                                    if(json[key][k] == "NE"){
                                        csvLines[1].push(protect(""))
                                    }else{
                                        csvLines[1].push(protect(json[key][k]))
                                    }
                                }else if(k == 'notas'){
                                    csvLines[0].push(protect("Notas ao DF"))
                                    csvLines[1].push(protect(json[key][k]))
                                }
                            }
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

function joinLines(csvLines){
    var len = csvLines.length

    for(var i=0; i<len; i++){
        csvLines[i] = csvLines[i].join(',')
    }

    var csv = csvLines.join('\n')
    return csv
}

function convertClasses(json){
    var csvLines = []
    var len = json.length

    if(len > 0){
        csvLines = convertClasse(json[0])

        for(var i = 1; i < len; i++){
            var aux = convertClasse(json[i])
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
            csvLines = convertClasses(json)
            break
        case "classe":
            csvLines = convertClasse(json)
            break
        default:
            throw("Não é possível exportar para CSV nesta rota...")
            break
    }

    csv = joinLines(csvLines)
    return csv
}
