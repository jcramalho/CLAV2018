const execQuery = require('../../controllers/api/utils').execQuery
const normalizeOrdered = require('../../controllers/api/utils').normalizeOrdered

var Indicadores = module.exports

//Classes

Indicadores.totalClassesN = async (nivel) => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        {?s a clav:Classe_N${nivel}.}
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalClasses = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        {?s a clav:Classe_N1.}
        union
        {?s a clav:Classe_N2.}
        union
        {?s a clav:Classe_N3.}
        union
        {?s a clav:Classe_N4.}
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

//Entidades

Indicadores.totalEntidades = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s a clav:Entidade .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalEntidadesAtivas = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s a clav:Entidade .
        ?s clav:entEstado "Ativa" .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

//Tipologias

Indicadores.totalTipologias = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s a clav:TipologiaEntidade .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

//Legislacao

Indicadores.totalLegislacao = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s a clav:Legislacao .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalLegislacaoAtivos = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s a clav:Legislacao .
        ?s clav:diplomaEstado "Ativo" .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

//Relacoes

Indicadores.totalRelacoes = async (relacao) => {
    const query = `SELECT ?p (COUNT(?p) as ?pCount) WHERE {
        ?s ?p ?o .
    } GROUP BY ?p`

    results = await execQuery("query", query)
    results = normalizeOrdered(results)

    total = null
    for(var i = 0; i < results.length && !total; i++){
        var rel = results[i].p.split("#").pop()
        
        if(rel == relacao){
            total = results[i].pCount
        }
    }

    return total
}

Indicadores.totalDF = async (valor) => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s clav:temDF ?df .
        ?df clav:dfValor "${valor}" .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalCritJust = async (crit) => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        ?s a clav:CriterioJustificacao${crit} .
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}
