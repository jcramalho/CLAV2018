const client = require('../../config/database').onthology
const normalize = require('../../controllers/api/utils').normalize;
const Pedidos = require('../../controllers/api/pedidos');
var TermosIndice = module.exports

/**
 * @typedef {Object} TermoIndice
 * @property {string} id (ex: "ti_c350.10.506_1")
 * @property {string} termo (ex: "Abandono escolar")
 * @property {string} idClasse (ex: "c650.20.001")
 * @property {string} codigoClasse (ex: "650.20.001")
 * @property {string} tituloClasse (ex: "Sinalização e encaminhamento em situações de vulnerabilidade")
 */

/**
 * Lista os termos de índice registados no sistema.
 * 
 * @return {Promise<[TermoIndice] | Error>} promessa que quando cumprida contém a
 * lista dos termos de índice
 */
TermosIndice.listar = () => {
    let query = `
        SELECT ?id ?termo ?idClasse ?tituloClasse 
        WHERE { 
            ?idTI rdf:type clav:TermoIndice ;
                clav:termo ?termo ;
                clav:estaAssocClasse ?idC .
            ?idC clav:titulo ?tituloClasse ;
                clav:codigo ?codigoClasse.
            BIND(CONCAT('c', ?codigoClasse) AS ?idClasse).
            BIND(STRAFTER(STR(?idTI), "clav#") AS ?id)
        }
        ORDER BY ?termo`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
}

TermosIndice.assocClasse = classe => {
    let query = `
        SELECT ?id ?termo WHERE { 
            ?idTI rdf:type clav:TermoIndice ;
                clav:termo ?termo ;
                clav:estaAssocClasse clav:${classe} .
            BIND (STRAFTER(STR(?idTI), 'clav#') AS ?id).
        }
        ORDER BY ?termo`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
}

TermosIndice.lastID = function () {
    let fetchQuery = `
        SELECT * WHERE { 
            ?id rdf:type clav:TermoIndice
        } ORDER BY DESC(?id)
        LIMIT 1
    `;

    return client.query(fetchQuery)
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0]))
        .catch(function (error) {
            console.error(error);
        });
}