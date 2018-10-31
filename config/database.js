const { SparqlClient, SPARQL } = require('sparql-client-2');

module.exports.onthology = new SparqlClient('http://localhost:7200/repositories/clav20180918', {
    updateEndpoint: 'http://localhost:7200/repositories/clav20180918/statements'
}).register({
    rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
    clav: 'http://jcr.di.uminho.pt/m51-clav#',
    owl: 'http://www.w3.org/2002/07/owl#',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    noInferences: 'http://www.ontotext.com/explicit',
    skos: 'http://www.w3.org/2004/02/skos/core#'
});

module.exports.userDB = 'mongodb://localhost/m51-clav';

/**
 * Normaliza os resultados de uma query SPARQL.
 * 
 * @example
 * Assumindo que o resultado de uma query (response.results.bindings) é o
 * seguinte:
 *     [
 *       {
 *         "Designacao": {
 *           "type": "literal",
 *           "value": "Comunidade Económica Europeia"
 *         },
 *         "Estado": {
 *           "type": "literal",
 *           "value": "Ativa"
 *         }
 *       }
 *     ]
 * 
 * O seu formato devidamente normalizado será:
 *     [
 *       {
 *         "Designacao": "Comunidade Económica Europeia",
 *         "Estado": "Ativa"
 *       }
 *     ]
 * 
 * 
 * @param response objeto resultante de uma query SPARQL
 * @return array de objetos devidamente normalizados
 */
exports.normalize = function(response) {
    return response.results.bindings.map(obj =>
        Object.entries(obj)
            .reduce((new_obj, [k,v]) => (new_obj[k] = (v.value || v), new_obj),
                    new Object()));
};