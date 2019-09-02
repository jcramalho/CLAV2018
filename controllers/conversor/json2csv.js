function protect(string){
    return '"' + string + '"'
}

function json2csvArray(name, array){
    var csv = [[]]
    var accum = []
    var remHeaders = []
    var len = array.length

    if(len){
        if(array[0] instanceof Array){
            var header = name != '' ? '.' + name : ''
            array.forEach((arr, index) => csv = csv.concat(json2csvRec(index + header, arr)))
        }else{
            if(typeof array[0] === 'object'){

                //headers
                for(var key in array[0]){
                    var header = name != '' ? name + '.' + key : key
                    csv[0].push(protect(header))
                }
                //lines
                for(var i=0; i<len; i++){
                    var line = []
                    for(var key in array[i]){
                        var header = name != '' ? name + '.' : ''

                        if(typeof array[i][key] != 'object' && !(array[i][key] instanceof Array)){
                            line.push(protect(array[i][key]))
                        }else{
                            if(array[i][key] instanceof Array){
                                if(!remHeaders.includes(protect(header + key))){
                                    remHeaders.push(protect(header + key))
                                }
                            }
                            accum = accum.concat(json2csvRec(header + i + '.' + key, array[i][key]))
                        }
                    }

                    csv.push(line)
                }

                remHeaders.forEach(h => {
                    var i = csv[0].indexOf(h)
                    if(i>-1){
                        csv[0].splice(i,1)
                    }
                })
            }else{
                csv[0].push(protect(name))
                array.forEach(e => csv.push([e]))
            }
        }
    }else{
        csv[0].push(protect(name))
    }

    csv.push([])
    csv = csv.concat(accum)
    return csv
}

function json2csvRec(name,json){
    var csvLines
    var remHeaders = []

    if(json instanceof Array){
        csvLines = json2csvArray(name, json)
    }else{
        csvLines = [[],[],[]]

        for(var key in json){
            var header = name != '' ? name + '.' + key : key

            if(json[key] instanceof Array){
                csvLines = csvLines.concat(json2csvArray(header, json[key]))

                if(!remHeaders.includes(protect(header))){
                    remHeaders.push(protect(header))
                }
            }else{
                if(typeof json[key] === 'object'){
                    csvLines = csvLines.concat(json2csvRec(header, json[key]))
                }else{
                    csvLines[0].push(protect(header))
                    csvLines[1].push(protect(json[key]))
                }
            }
        }

        remHeaders.forEach(h => {
            var i = csvLines[0].indexOf(h)
            if(i>-1){
                csvLines[0].splice(i,1)
            }
        })

        if(csvLines[0].length == 0 && csvLines[1].length == 0){
            csvLines = csvLines.slice(3)
        }
    }
    
    return csvLines
}

module.exports.json2csv = (json) => {
    csvLines = json2csvRec('', json)

    var len = csvLines.length
    for(var i=0; i<len; i++){
        csvLines[i] = csvLines[i].join(',')
    }

    var csv = csvLines.join('\n')
    return csv
}
