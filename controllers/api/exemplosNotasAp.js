const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize;
var ExemplosNotasAp = module.exports

// Devolve a lista com todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
ExemplosNotasAp.todosExemplosNotasAp = () => {
    var query = `
    SELECT ?idExemplo ?exemplo ?cProc ?tituloProc WHERE { 
        ?idExemplo a clav:ExemploNotaAplicacao .
        ?idExemplo clav:conteudo ?exemplo .
        ?codigoProc clav:temExemploNA ?idExemplo .
        ?codigoProc clav:titulo ?tituloProc .
        BIND(STRAFTER(STR(?codigoProc), "clav#") AS ?cProc) .
    }`
    return execQuery("query", query)
        .then(response => normalize(response))
}
