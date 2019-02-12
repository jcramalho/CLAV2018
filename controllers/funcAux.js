exports.simplificaSPARQLRes = (sparqlRes, campos) => {
    var resultado = new Array()
    for(var i=0; i < sparqlRes.length; i++){
        resultado[i] = {}
        for(var j=0; j < campos.length; j++){
            if(sparqlRes[i][campos[j]])
                resultado[i][campos[j]] = sparqlRes[i][campos[j]].value
        }
    }
    return resultado
}
