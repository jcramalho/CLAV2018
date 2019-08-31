const sizeTab = 4

function protectForXml(string){
    string = string.replace(/</g,'&lt;')
    string = string.replace(/>/g,'&gt;')
    string = string.replace(/&/g,'&amp;')
    string = string.replace(/'/g,'&apos;')
    string = string.replace(/"/g,'&quot;')
    return string
}

function json2xmlArray(array, nTabs){
    var len = array.length
    var xml = array.length ? '\n' : ''

    for(var i=0; i<len; i++){
        xml += ' '.repeat(nTabs * sizeTab) + '<item index="' + i + '">\n'
        xml += json2xmlRec(array[i], nTabs + 1)
        xml += ' '.repeat(nTabs * sizeTab) + '</item>\n'
    }

    xml += array.length ? ' '.repeat((nTabs - 1) * sizeTab) : ''
    return xml
}

function json2xmlRec(json, nTabs){
    var xml = ''

    if(json instanceof Array){
        xml = json2xmlArray(json)
    }else{
        for(var key in json){
            var aux = ''
            var type = ''

            if(json[key] instanceof Array){
                aux = json2xmlArray(json[key], nTabs + 1)
                type = 'array'
            }else{
                type = typeof json[key]
                if(type === 'object' || type === 'function'){
                    aux = '\n'
                    aux += json2xmlRec(json[key], nTabs + 1) 
                    aux += ' '.repeat(nTabs * sizeTab)
                }else if (type === 'string'){
                    aux = protectForXml(json[key])
                }else{
                    aux = json[key]
                }
            }

            xml += ' '.repeat(nTabs * sizeTab)
            xml += '<' + key + ' type="' + type + '">'
            xml += aux + '</' + key + '>\n'
        }
    }
    return xml
}

module.exports.json2xml = (json) => {
    var xml = '<?xml version="1.0" encoding="utf-8"?>\n'
    xml += '<root>\n'
    xml += json2xmlRec(json, 1)
    xml += '</root>'
    return xml
}
