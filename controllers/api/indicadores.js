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

//Devolve total de entidades ativas/inativas
Indicadores.totalEntidadesAtivas = async () => {
    const query = `
    SELECT 
      ?indicador (COUNT(?s) as ?valor)
    WHERE{
        ?s a clav:Entidade .
        ?s clav:entEstado ?indicador .
    }
    GROUP BY ?indicador`

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

//Devolve total de diplomas ativos/revogados
Indicadores.totalLegislacaoAtivos = async () => {
    const query = `SELECT 
    ?indicador (COUNT(?s) as ?valor)
    WHERE{
        ?s a clav:Legislacao .
        ?s clav:diplomaEstado ?indicador .
    } GROUP BY ?indicador`

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

// Devolve as estatísticas relacionais dos Processos
Indicadores.relStats = async () => {
    var query = `
    Select 
        ?indicador (COUNT(?indicador) as ?valor)
    WHERE {
        ?pn a clav:Classe_N3 .
        {?o a clav:Classe_N3} UNION {?o a clav:Entidade} UNION {?o a clav:Legislacao} .
        ?pn ?indicador ?o .
    } Group by ?indicador`

    let resultado = await execQuery("query", query)
    return normalize(resultado)
}

// Devolve as estatísticas relativas dos Critérios de Justificações
Indicadores.critStats = async () => {
    var query = `
    SELECT 
        ?indicador (COUNT(?indicador) as ?valor)
    WHERE{
        ?c a clav:CriterioJustificacao .
        ?c a ?indicador .
    FILTER(?indicador != owl:NamedIndividual && ?indicador != clav:AtributoComposto) .
    }
    GROUP BY ?indicador`

    let resultado = await execQuery("query", query)
    return normalize(resultado)
}

// Devolve as estatísticas relacionais aos aos Destinos finais
Indicadores.dfStats = async () => {
    var query = `
    SELECT 
        ?indicador (COUNT(?indicador) as ?valor)
    WHERE{
        ?s clav:temDF ?d .
        ?d clav:dfValor ?indicador .
    } Group by ?indicador`

    let resultado = await execQuery("query", query)
    return normalize(resultado)
}