function protect(string){
    return '"' + string + '"'
}

function json2csvArray(name, array){
    var csv = [[]]
    var accum = []
    var len = array.length

    if(len){
        if(array[0] instanceof Array){
            var header = name != '' ? name + '.' : ''
            array.forEach((arr, index) => csv = csv.concat(json2csvRec(header + index, arr)))
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
                            accum = accum.concat(json2csvRec(header + key + '.' + i, array[i][key]))
                        }
                    }

                    csv.push(line)
                }
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

    if(json instanceof Array){
        csvLines = json2csvArray(name, json)
    }else{
        csvLines = [[],[],[]]

        for(var key in json){
            var header = name != '' ? name + '.' + key : key

            if(json[key] instanceof Array){
                csvLines = csvLines.concat(json2csvArray(header, json[key]))
            }else{
                if(typeof json[key] === 'object'){
                    csvLines = csvLines.concat(json2csvRec(header, json[key]))
                }else{
                    csvLines[0].push(protect(header))
                    csvLines[1].push(protect(json[key]))
                }
            }
        }

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
