const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize
const Entidades = module.exports

/**
 * @typedef {Object} Entidade
 * @property {string} id (ex: "ent_AR")
 * @property {string} sigla (ex: "AR")
 * @property {string} designacao (ex: "Assembleia da República")
 * @property {string} internacional (ex: "Sim" ou "Não")
 * @property {string} sioe  (id para sistema SIOE)
 * @property {string} estado (ex: "Ativa", "Inativa" ou "Harmonização")
 */

/**
 * Lista as meta informações de todas as entidades no sistema, de acordo
 * com o filtro especificado.
 *
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.sigla (ex: "AR")
 * @param {string} filtro.designacao (ex: "Assembleia da República")
 * @param {string} filtro.internacional (ex: "Sim" ou "Não")
 * @param {string} filtro.sioe (ex: "875780390")
 * @param {string} filtro.estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @return {Promise<[Entidade] | Error>} promessa que quando cumprida contém a
 * lista das entidades existentes que respeitam o filtro dado
 */
Entidades.listar = (filtro) => {
	const query = `SELECT ?id ?sigla ?designacao ?internacional ?sioe ?estado {
        ?uri rdf:type clav:Entidade ;
            clav:entEstado ?estado;
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entInternacional ?internacional .
        OPTIONAL {
            ?uri clav:entSIOE ?sioe.
        }
        BIND(CONCAT('ent_', ?sigla) AS ?id).

        FILTER (${Object.entries(filtro)
			.filter(([k, v]) => v !== undefined && k != 'token' && k != 'apikey' && k != 'OF')
			.map(([k, v]) => `?${k} = "${v}"`)
			.concat(['True'])
			.join(' && ')})
    } ORDER BY ?sigla`

	return execQuery('query', query).then((response) => normalize(response))
}

//Lista tipologias e donos de todas as entidades. O formato devolvido está pronto ao ser usado na exportação CSV
Entidades.listarTipsDonos = () => {
    const query = `SELECT ?sigla
                        (GROUP_CONCAT(DISTINCT ?tipologiaSigla; SEPARATOR="#\\n") AS ?tipologias)
                        (GROUP_CONCAT(DISTINCT ?donoCodigo; SEPARATOR="#\\n") AS ?dono) {

        ?uri rdf:type clav:Entidade ;
            clav:entSigla ?sigla .
		
    	OPTIONAL {
        	?uri clav:pertenceTipologiaEnt ?uriT .
        	?uriT clav:tipEstado "Ativa";
            	clav:tipSigla ?tipologiaSigla.
    	}

    	OPTIONAL{
        	?do clav:temDono ?uri;
            	clav:codigo ?donoCodigo ;
            	clav:pertenceLC clav:lc1 ;
            	clav:classeStatus "A" .
    	}
    }
    group by ?sigla`

	return execQuery('query', query).then((response) => normalize(response))
}

//Lista participantes de todas as entidades. O formato devolvido está pronto ao ser usado na exportação CSV
Entidades.listarParticipantes = () => {
    const query = `SELECT ?sigla
                        (GROUP_CONCAT(?partCodigo; SEPARATOR="#\\n") AS ?participante)
                        (GROUP_CONCAT(?tipoP; SEPARATOR="#\\n") AS ?tipoPar) {

        ?uri rdf:type clav:Entidade ;
    		clav:entSigla ?sigla .
    
    	OPTIONAL{
        	?uriP clav:temParticipante ?uri;
        	    ?tipoParURI ?uri ;
        	    clav:codigo ?partCodigo ;
        	    clav:pertenceLC clav:lc1 ;
        	    clav:classeStatus "A" .
  	     	BIND (STRAFTER(STR(?tipoParURI), 'clav#') AS ?tipoP).
    	   	FILTER (?tipoParURI != clav:temParticipante && ?tipoParURI != clav:temDono)
    	}
    }
    group by ?sigla`

	return execQuery('query', query).then((response) => normalize(response))
}

// Lista todas as entidades com PNs associados (como Dono ou como Participante)
Entidades.listarComPNs = () => {
	const query = `SELECT ?id ?sigla ?designacao ?internacional ?sioe ?estado 
    WHERE { 
            ?uri rdf:type clav:Entidade ;
                clav:entEstado ?estado;
                clav:entDesignacao ?designacao ;
                clav:entSigla ?sigla ;
                clav:entInternacional ?internacional .
            OPTIONAL {
                ?uri clav:entSIOE ?sioe.
            } 
            {
        FILTER EXISTS { ?pn clav:temDono ?uri. }
        FILTER EXISTS { ?pn clav:temParticipante ?uri. }
            
        } UNION {
            {
        FILTER NOT EXISTS { ?pn clav:temDono ?uri. }
        FILTER EXISTS { ?pn clav:temParticipante ?uri. }
            }
        } UNION {
            {
        FILTER EXISTS { ?pn clav:temDono ?uri. }
        FILTER NOT EXISTS { ?pn clav:temParticipante ?uri. }
            }
        } BIND(CONCAT('ent_', ?sigla) AS ?id).
    } ORDER BY ?sigla`

	return execQuery('query', query).then((response) => normalize(response))
}

// Lista todas as entidades sem PNs associados (como Dono ou como Participante)
Entidades.listarSemPNs = () => {
	const query = `SELECT ?id ?sigla ?designacao ?internacional ?sioe ?estado {
            ?uri rdf:type clav:Entidade ;
                clav:entEstado ?estado;
                clav:entDesignacao ?designacao ;
                clav:entSigla ?sigla ;
                clav:entInternacional ?internacional .
            OPTIONAL {
                ?uri clav:entSIOE ?sioe.
            }
        FILTER NOT EXISTS {?pn clav:temDono ?uri.}
        FILTER NOT EXISTS {?pn clav:temParticipante ?uri.}
            BIND(CONCAT('ent_', ?sigla) AS ?id).

        } ORDER BY ?sigla`

	return execQuery('query', query).then((response) => normalize(response))
}

/**
 * Devolve a lista das tipologias às quais uma entidade pertence.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<[{sigla: string, designacao: string}] | Error>} promessa
 * que quando cumprida contém uma lista das siglas e designações das tipologias
 * às quais a entidade pertence
 */
Entidades.tipologias = (id) => {
	const query = `SELECT ?id ?sigla ?designacao WHERE {
        clav:${id} clav:pertenceTipologiaEnt ?uri .
        ?uri clav:tipEstado "Ativa";
            clav:tipSigla ?sigla;
            clav:tipDesignacao ?designacao.
        BIND (CONCAT('tip_', ?sigla) AS ?id)
    }`

	return execQuery('query', query).then((response) => normalize(response))
}

/**
 * Consulta a meta informação relativa a uma entidade (sigla, designação,
 * estado e internacional).
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<Entidade | Error>} promessa que quando cumprida contém a
 * entidade que corresponde ao identificador dado. Se a entidade não existir
 * então a promessa conterá o valor `undefined`
 */
Entidades.consultar = (id) => {
	const query = `SELECT ?sigla ?designacao ?estado ?internacional ?sioe WHERE {
        clav:${id} rdf:type clav:Entidade ;
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entEstado ?estado ;
            clav:entInternacional ?internacional .
        OPTIONAL {
            clav:${id} clav:entSIOE ?sioe
        }
    }`

	return execQuery('query', query).then((response) => normalize(response)[0])
}

/**
 * Verifica se uma determinada entidade existe no sistema.
 *
 * @param {Entidade} entidade
 * @return {Promise<boolean | Error>}
 */
Entidades.existe = (entidade) => {
	const query = `ASK {
        { ?e clav:entDesignacao|clav:tipDesignacao '${entidade.designacao}' }
        UNION
        { ?s clav:entSigla|clav:tipSigla '${entidade.sigla}' }
    }`

	return execQuery('query', query).then((response) => response.boolean)
}

/**
 * Verifica se uma determinada sigla de entidade existe no sistema.
 *
 * @param {Sigla} sigla
 * @return {Promise<boolean | Error>}
 */
Entidades.existeSigla = (sigla) => {
	const query = `ASK {
      ?s clav:entSigla|clav:tipSigla '${sigla}' 
  }`

	return execQuery('query', query).then((response) => response.boolean)
}

/**
 * Verifica se uma determinada designacao de entidade existe no sistema.
 *
 * @param {Designacao} designacao
 * @return {Promise<boolean | Error>}
 */
Entidades.existeDesignacao = (designacao) => {
	const query = `ASK {
      ?e clav:entDesignacao|clav:tipDesignacao '${designacao}' 
  }`

	return execQuery('query', query).then((response) => response.boolean)
}

/**
 * Lista os processos em que uma entidade intervem como dona.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<{codigo: string, titulo: string} | Error>} promessa que
 * quando cumprida contém os códigos e títulos dos processos onde a entidade
 * participa como dona
 */
Entidades.dono = (id) => {
	const query = `SELECT ?codigo ?titulo WHERE {
        ?id clav:temDono clav:${id} ;
            clav:codigo ?codigo ;
            clav:titulo ?titulo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
    }`

	return execQuery('query', query).then((response) => normalize(response))
}

/**
 * Lista os processos em que uma entidade intervem como participante.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<[{codigo: string, titulo: string}] | Error>} promessa que
 * quando cumprida contém os códigos e títulos dos processos onde a entidade
 * participa
 */
Entidades.participante = (id) => {
	const query = `SELECT ?tipoPar ?codigo ?titulo WHERE { 
        ?uri clav:temParticipante clav:${id} ;
            ?tipoParURI clav:${id} ;
            clav:titulo ?titulo ;
            clav:codigo ?codigo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
        BIND (STRAFTER(STR(?tipoParURI), 'clav#') AS ?tipoPar).
        FILTER (?tipoParURI != clav:temParticipante && ?tipoParURI != clav:temDono)
    }`

	return execQuery('query', query).then((response) => normalize(response))
}

//Criar controller para inserir na base de dados, depois do pedido aprovado!!
/*const query = `INSERT DATA {
    clav:ent_${entidade.sigla} rdf:type owl:NamedIndividual , clav:Entidade ;
        clav:entDesignacao '${entidade.designacao}' ;
        clav:entSigla '${entidade.sigla}' ;
        clav:entInternacional '${entidade.internacional}' ;
        clav:entSIOE '${entidade.sioe}';

        ${entidade.tipologias.map(tipologia => `clav:pertenceTipologiaEnt clav:${tipologia} ;`).join('\n')}
        clav:entEstado 'Harmonização' .
}`;
*/
