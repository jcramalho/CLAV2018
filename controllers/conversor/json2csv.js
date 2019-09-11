function protect(string){
    if(string != null){
        if(typeof string === 'string'){
            string = string.replace(/"/g,'""')
        }
        return '"' + string + '"'
    }else
        return '""'
}

function merge(arr1, arr2){
    arr2.forEach((l, index) => {
        if(arr1[index]){
            arr1[index] = arr1[index].concat(arr2[index])
        }else{
            arr1.push(arr2[index])
        }
    })
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
            console.log(JSON.stringify(array))
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
            csv = [protect(key), protect(join(array))]
            break
    }

    if(csv.length == 0){
        titles.forEach((t, index) => titles[index] = protect(t))
        columns.forEach((c, index) => columns[index] = protect(join(c)))
        csv = [titles, columns]
    }

    return csv
}

function json2csvRec(json){
    var csvLines

    if(json instanceof Array){
        //csvLines = json2csvArray(json)
    }else{
        csvLines = [[],[]]

        for(var key in json){
            if(json[key] instanceof Array){
                if(key == 'filhos'){
                    csvLines = csvLines.concat(json[key])
                }else{
                    var aux = json2csvArray(json[key], key)
                    csvLines[0] = csvLines[0].concat(aux[0])
                    csvLines[1] = csvLines[1].concat(aux[1])
                }
            }else{
                if(typeof json[key] === 'object'){
                    if(key != "pai"){
                        if(key == 'pca' || key == 'df'){
                            for(var k in json[key]){
                                if(!k.startsWith('id')){
                                    if(k == 'justificacao'){
                                        var crits = []
                                        var procs = []
                                        var legs = []
                                        csvLines[0].push(protect('Critério'))
                                        csvLines[0].push(protect('Processos'))
                                        csvLines[0].push(protect('Legislação'))

                                        json[key][k].forEach(just => {
                                            crits.push(just.tipoId)
                                            if(just.processos.length > 0){
                                                var ps = []
                                                just.processos.forEach(p => ps.push(p.procId))
                                                procs.push(ps.join(';\n'))
                                                legs.push("")
                                            }else if(just.legislacao.length > 0){
                                                var ls = []
                                                just.legislacao.forEach(l => ls.push(l.legId))
                                                legs.push(ls.join(';\n'))
                                                procs.push("")
                                            }
                                        })
                                        csvLines[1].push(protect(join(crits)))
                                        csvLines[1].push(protect(join(procs)))
                                        csvLines[1].push(protect(join(legs)))
                                    }else{
                                        if(key == 'pca' && k == 'valores'){
                                            csvLines[0].push(protect("Prazo de conservação administrativa"))
                                        }else if(key == 'df' && k == 'valor'){
                                            csvLines[0].push(protect("Destino final"))
                                        }else{
                                            csvLines[0].push(protect(k + ' ' + key.toUpperCase()))
                                        }
                                        csvLines[1].push(protect(json[key][k]))
                                    }
                                }
                            }
                        }else{
                            var aux = json2csvRec(json[key])
                            merge(csvLines, aux)
                        }
                    }
                }else{
                    csvLines[0].push(protect(key))
                    csvLines[1].push(protect(json[key]))
                }
            }
        }
    }
    
    return csvLines
}

function convertClasse(json){
    var csvL = json2csvRec(json)

    var len = csvL.length

    var csvLines = []
    csvLines[0] = csvL[0]
    csvLines[1] = csvL[1]

    for(var i=2; i<len; i++){
        csvLines[i] = []

        csvL[0].forEach(h => {
            var header = h.replace(/"/g,'') 
            if(csvL[i][header]){
                csvLines[i].push(protect(csvL[i][header]))
            }else{
                csvLines[i].push("")
            }
        })
    }

    for(var i=0; i<len; i++){
        csvLines[i] = csvLines[i].join(',')
    }

    var csv = csvLines.join('\n')
    return csv
}

module.exports.json2csv = (json, type) => {
    var csv

    switch(type){
        case "classes":
            break
        case "classe":
            csv = convertClasse(json)
            break
        default:
            throw("Não é possível exportar para CSV nesta rota...")
            break
    }

    return csv
}
