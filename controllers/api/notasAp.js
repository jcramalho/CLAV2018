const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize;
var NotasAp = module.exports

// Devolve a lista com todas as notas de aplicação: idNota, nota, codigoProc, tituloProc
NotasAp.todasNotasAp = () => {
    var query = `
            SELECT ?idNota ?nota ?codigoProc ?tituloProc WHERE { 
                ?idNota a clav:NotaAplicacao .
                ?idNota clav:conteudo ?nota .
                ?codigoProc clav:temNotaAplicacao ?idNota .
                ?codigoProc clav:titulo ?tituloProc .
            }`
    return execQuery("query", query)
        .then(response => normalize(response))
}
