const sizeTab = 4

function protectForXml(string){
    string = string.replace(/</g,'&lt;')
    string = string.replace(/>/g,'&gt;')
    string = string.replace(/&/g,'&amp;')
    string = string.replace(/'/g,'&apos;')
    string = string.replace(/"/g,'&quot;')
    return string
}

function protectKey(string){
    string = string.replace(/<|>|'|"/g,'')
    string = string.replace(/&|\s+/g,'_')
    return string
}

function json2xmlArray(array, nTabs){
    var xml = ''
    var len = array.length
    var type
    
    for(var i=0; i<len; i++){
        type = typeof array[i]
        xml += ' '.repeat(nTabs * sizeTab) + '<item index="' + i + '" type="' + type + '">'

        if(type === 'object' || type === 'string' || type === 'boolean' || type === 'number'){
            xml += json2xmlRec(array[i], nTabs + 1)
        }

        if(type === 'object'){
            xml += ' '.repeat(nTabs * sizeTab)
        }
        xml += '</item>\n'
    }

    return xml
}

function json2xmlRec(json, nTabs){
    var xml = ''
    var type = typeof json

    if(type == 'object'){
        xml = '\n'

        if(json instanceof Array){
            xml += json2xmlArray(json, nTabs)
        }else{
            var aux

            for(var key in json){
                aux = ''
                type = typeof json[key]

                if(type === 'object'){
                    if(json[key] instanceof Array){
                        aux += '\n' + json2xmlArray(json[key], nTabs + 1)
                        type = 'array'
                    }else{
                        aux += json2xmlRec(json[key], nTabs + 1) 
                    }

                    aux += ' '.repeat(nTabs * sizeTab)
                }else if(type === 'string'){
                    aux = protectForXml(json[key])
                }else if(type === 'boolean' || type === 'number'){
                    aux = json[key]
                }

                xml += ' '.repeat(nTabs * sizeTab)
                xml += '<' + protectKey(key) + ' type="' + type + '">'
                xml += aux + '</' + protectKey(key) + '>\n'
            }
        }
    }else if(type === 'string'){
        xml = protectForXml(json)
    }else if(type === 'boolean' || type === 'number'){
        xml = json
    }
    return xml
}

module.exports.json2xml = (json) => {
    var xml = '<?xml version="1.0" encoding="utf-8"?>\n'
    xml += '<root>'
    xml += json2xmlRec(json, 1)
    xml += '</root>'
    return xml
}
