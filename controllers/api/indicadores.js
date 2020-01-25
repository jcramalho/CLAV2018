const execQuery = require('../../controllers/api/utils').execQuery
const normalizeOrdered = require('../../controllers/api/utils').normalizeOrdered

var Indicadores = module.exports

Indicadores.totalClassesN4 = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        {?s a clav:Classe_N4.}
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalClassesN3 = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        {?s a clav:Classe_N3.}
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalClassesN2 = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        {?s a clav:Classe_N2.}
    }`

    results = await execQuery("query", query)
    return normalizeOrdered(results)[0].count
}

Indicadores.totalClassesN1 = async () => {
    const query = `SELECT (COUNT(?s) as ?count) WHERE {
        {?s a clav:Classe_N1.}
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
