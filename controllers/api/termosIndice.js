const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
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
        SELECT ?id ?termo ?idClasse ?tituloClasse ?estado ?codigoClasse
        WHERE { 
            ?idTI rdf:type clav:TermoIndice ;
                clav:termo ?termo ;
                clav:estado ?estado;
                clav:estaAssocClasse ?idC .
            ?idC clav:titulo ?tituloClasse ;
                clav:codigo ?idClasse.
            BIND(STRAFTER(STR(?idTI), "clav#") AS ?id) .
            BIND(STRAFTER(STR(?idC), "clav#") AS ?codigoClasse)
        }
        ORDER BY ?termo`

	return execQuery('query', query).then((response) => normalize(response))
}

// Testa a existência de um determinado TI
TermosIndice.existe = (termoIndice) => {
	const query = `
        ASK { 
            ?s rdf:type clav:TermoIndice.
            ?s clav:termo "${termoIndice}"
        }`
	return execQuery('query', query).then((response) => {
		return response.boolean
	})
}

TermosIndice.assocClasse = (classe) => {
	let query = `
        SELECT ?id ?termo WHERE { 
            ?idTI rdf:type clav:TermoIndice ;
                clav:termo ?termo ;
                clav:estaAssocClasse clav:${classe} .
            BIND (STRAFTER(STR(?idTI), 'clav#') AS ?id).
        }
        ORDER BY ?termo`

	return execQuery('query', query).then((response) => normalize(response))
}

TermosIndice.lastID = function() {
	let fetchQuery = `
        SELECT * WHERE { 
            ?id rdf:type clav:TermoIndice
        } ORDER BY DESC(?id)
        LIMIT 1
    `

	return (
		execQuery('query', fetchQuery)
			//getting the content we want
			.then((response) => Promise.resolve(response.results.bindings[0]))
			.catch(function(error) {
				console.error(error)
			})
	)
}

TermosIndice.contar = function() {
	let query = `
        SELECT (count (?s) as ?num) WHERE { 
            ?s rdf:type clav:TermoIndice
        }
    `

	return execQuery('query', query).then((response) => normalize(response))
}
