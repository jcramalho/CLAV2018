function protect(string){
    if(string){
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

function json2csvArray(array){
    var csv = []
    var len = array.length

    if(len){
        if(array[0] instanceof Array){
            //array.forEach((arr, index) => csv = csv.concat(json2csvArray(arr)))
        }else{
            if(typeof array[0] === 'object'){
                if(array[0].nota){
                    var aux = []
                    array.forEach(e => {
                        aux.push(e.nota)
                    })
                    csv = protect(join(aux))
                }else if(array[0].exemplo){

                }else{
                /*    for(var i=0; i<len; i++){
                        csv.push([protect(JSON.stringify(array[i]))])
                    }*/
                }
            }else{
                csv = protect(join(array))
            }
        }
    }

    return csv
}

function json2csvRec(json){
    var csvLines

    if(json instanceof Array){
        csvLines = json2csvArray(json)
    }else{
        csvLines = [[],[]]

        for(var key in json){
            if(json[key] instanceof Array){
                if(key == 'filhos'){
                    csvLines = csvLines.concat(json[key])
                }else{
                    csvLines[0].push(protect(key))
                    csvLines[1].push(json2csvArray(json[key]))
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
                                            if(just.processos){
                                                var ps = []
                                                just.processos.forEach(p => ps.push(p.procId))
                                                procs.push(ps.join(';\n'))
                                                legs.push("")
                                            }else if(just.legislacao){
                                                legs.push(JSON.stringify(json[key][k].legislacao))
                                                procs.push("")
                                            }
                                        })
                                        csvLines[1].push(protect(join(crits)))
                                        csvLines[1].push(protect(join(procs)))
                                        csvLines[1].push(protect(join(legs)))
                                    }else{
                                        csvLines[0].push(protect(k + ' ' + key.toUpperCase()))
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

module.exports.json2csv = (json) => {
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
