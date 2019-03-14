const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/utils').normalize;
const Pedidos = require('../../controllers/pedidos');
const Tipologias = module.exports;

/**
 * @typedef {Object} Tipologia
 * @property {string} id (ex: "tip_AP")
 * @property {string} sigla (ex: "AP")
 * @property {string} designacao (ex: "Administração Pública")
 * @property {string} estado (ex: "Ativa", "Inativa" ou "Harmonização")
 */

/**
 * Lista as meta informações de todas as tipologias de entidades no sistema,
 * de acordo com o filtro especificado.
 * 
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.sigla (ex: "AP")
 * @param {string} filtro.designacao (ex: "Administração Pública")
 * @param {string} filtro.estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @return {Promise<[Tipologia] | Error>} promessa que quando cumprida contém a
 * lista das tipologias de entidades existentes que respeitam o filtro dado
 */
Tipologias.listar = (filtro) => {
    const query = `SELECT ?id ?estado ?designacao ?sigla {
        ?uri rdf:type clav:TipologiaEntidade ;
            clav:tipEstado ?estado;
            clav:tipDesignacao ?designacao ;
            clav:tipSigla ?sigla .
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)

        FILTER (${Object.entries(filtro)
            .filter(([k,v]) => v !== undefined)
            .map(([k,v]) => `?${k} = "${v}"` )
            .join(' && ')} )
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

/**
 * Consulta a meta informação relativa a uma tipologia entidade
 * (sigla, designação e estado).
 *
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<Tipologia | Error>} promessa que quando cumprida contém a
 * tipologia que corresponde ao identificador dado. Se a tipologia não existir
 * então a promessa conterá o valor `undefined`
 */
Tipologias.consultar = (id) => {
    const query = `SELECT ?designacao ?sigla ?estado where {
        clav:${id} clav:tipDesignacao ?designacao ;
            clav:tipSigla ?sigla ;
            clav:tipEstado ?estado .
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response)[0]);
};

/**
 * Insere uma nova tipologia no sistema, gerando um pedido apropriado.
 * A entidade criada encontrar-se-á no estado "Harmonização".
 * NOTA: Esta função altera sempre o estado da base de dados, devendo-se por
 * isso verificar primeiro se o identificador da entidade a inserir ainda não
 * se encontra em uso.
 * 
 * @see pedidos
 * 
 * @param {Tipologia} tipologia tipologia que se pretende criar
 * @param {string} utilizador email do utilizador que criou a tipologia
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação da nova tipologia
 */
Tipologias.criar = async (tipologia, utilizador) => {
    Pedidos.criar('Criação', 'Tipologia', tipologia, utilizador)
};

/**
 * Gera um pedido de alteração de uma tipologia.
 * Nenhuma alteração será feita à tipologia, só quando o pedido for
 * validado.
 * 
 * @see pedidos
 * 
 * @param {string} id código identificador da tipologia (p.e, "tip_CEE")
 * @param {Object} alteracoes
 */
Tipologias.alterar = async (id, alteracoes, utilizador) => {
    return Pedidos.criar('Alteração', 'Tipologia', alteracoes, utilizador);
}

//Criar controller para inserir na base de dados, depois do pedido aprovado!!
/*const query = `INSERT DATA {
        clav:tip_${tipologia.sigla} rdf:type owl:NamedIndividual , clav:TipologiaEntidade ;
            clav:tipDesignacao '${tipologia.designacao}' ;
            clav:tipSigla '${tipologia.sigla}' ;
            
        ${tipologia.entidades.map(entidade => `clav:contemEntidade clav:${entidade} ;`).join('\n')}
        clav:tipEstado "Harmonização" .
    }`;*/

/**
 * Verifica se uma determinada tipologia existe no sistema.
 * 
 * @param {Tipologias} tipologia
 * @return {Promise<boolean | Error>}
 */
Tipologias.existe = (tipologia) => {
    const query = `ASK {
        { ?e clav:tipDesignacao '${tipologia.designacao}' }
        UNION
        { ?s clav:tipSigla '${tipologia.sigla}' }
    }`;

    return client.query(query)
        .execute()
        .then(response => response.boolean);
};

/**
 * Gera um pedido de remoção da tipologia
 * Nenhuma alteração será feita à tipologia, só quando o pedido for
 * validado é que esta passará para o estado "Inativa"
 * 
 * @see pedidos
 * 
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @param {string} utilizador email do utilizador que apagou a tipologia
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a remoção da tipologia
 */
Tipologias.apagar = async (id, tipologia, utilizador) => {
    return Pedidos.criar('Remoção', 'Tipologia', tipologia, utilizador);
};

/**
 * Lista as entidades que pertencem a uma dada tipologia.
 * 
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<[Entidade] | Error>} promessa que quando cumprida contém a
 * lista das entidades que pertencem à tipologia dada
 */
Tipologias.elementos = (id) => {
    const query = `SELECT ?id ?sigla ?designacao WHERE {
        ?uri clav:pertenceTipologiaEnt clav:${id} .
        
        ?uri clav:entEstado "Ativa";
            clav:entSigla ?sigla;
            clav:entDesignacao ?designacao.

        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

/**
 * Lista os processos em que uma tipologia intervem como dona.
 * 
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<{codigo: string, titulo: string, id: string} | Error>} promessa
 * que quando cumprida contém os códigos e títulos dos processos onde a
 * tipologia participa como dona
 */
Tipologias.dono = (id) => {
    const query = `SELECT ?id ?codigo ?titulo WHERE {
        ?uri clav:temDono clav:tip_AP ;
            clav:codigo ?codigo ;
            clav:titulo ?titulo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

/**
 * Lista os processos em que uma tipologia intervem como participante.
 *
 * @param {string} id código identificador da tipologia (p.e, "tip_AP")
 * @return {Promise<[{codigo: string, titulo: string, id: string}] | Error>} promessa
 * que quando cumprida contém os códigos e títulos dos processos onde a
 * tipologia participa
 */
Tipologias.participante = (id) => {
    const query = `SELECT ?id ?tipoPar ?titulo ?codigo WHERE {
        ?uri clav:temParticipante clav:${id} ;
        ?tipoParURI clav:${id} ;
            clav:titulo ?titulo ;
            clav:codigo ?codigo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
    
        BIND (STRAFTER(STR(?uri), 'clav#') AS ?id).
        BIND (STRAFTER(STR(?tipoParURI), 'clav#') AS ?tipoPar).  
        FILTER (?tipoParURI != clav:temParticipante && ?tipoParURI != clav:temDono)
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

Tipologias.checkAvailability = function (name, initials) {
    var checkQuery = `
        SELECT (count(*) as ?Count) where { 
            {
                ?t clav:tipSigla ?s ;
                    clav:tipDesignacao ?n .
            } UNION {
                ?e clav:entSigla ?s ;
                    clav:entDesignacao ?n .
            }
            filter (?s='${initials}' || ?n='${name}').
        }
    `;

    return client.query(checkQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0].Count.value))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Tipologias.checkNameAvailability = function (name) {
    var checkQuery = ` 
        SELECT (count(*) as ?Count) where { 
            {
                ?t clav:tipDesignacao '${name}' .
            } UNION {
                ?e clav:entDesignacao '${name}' .
            }
        }
    `;

    return client.query(checkQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0].Count.value))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Tipologias.updateTipologia = function (dataObj) {

    function prepDelete(dataObj) {

        let ret = "";

        if (dataObj.domain.del && dataObj.domain.del.length) {
            for (let process of dataObj.domain.del) {
                ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
            }
        }

        for (const pType in dataObj.parts) {
            if (dataObj.parts[pType].del && dataObj.parts[pType].del.length) {
                for (let p of dataObj.parts[pType].del) {
                    ret += "\tclav:" + p.id + " clav:temParticipante" + pType + " clav:" + dataObj.id + " .\n";
                }
            }
        }

        if (dataObj.ents.del && dataObj.ents.del.length) {
            for (let elem of dataObj.ents.del) {
                ret += `\tclav:${elem.id} clav:pertenceTipologiaEnt clav:${dataObj.id} .\n`;
            }
        }

        return ret;
    }

    function prepInsert(dataObj) {
        let ret = "";

        if (dataObj.name) {
            ret += `\tclav:${dataObj.id} clav:entDesignacao '${dataObj.name}' .\n`;
        }

        if(dataObj.international) {
            ret += `
                clav:${dataObj.id} clav:entInternacional '${dataObj.international}' .
            `;
        }

        if (dataObj.domain.add && dataObj.domain.add.length) {
            for (let process of dataObj.domain.add) {
                ret += `\tclav:${process.id} clav:temDono clav:${dataObj.id} .\n`;
            }
        }

        for (const pType in dataObj.parts) {
            if (dataObj.parts[pType].add && dataObj.parts[pType].add.length) {
                for (let p of dataObj.parts[pType].add) {
                    ret += "\tclav:" + p.id + " clav:temParticipante" + pType + " clav:" + dataObj.id + " .\n";
                }
            }
        }

        if (dataObj.ents.add && dataObj.ents.add.length) {
            for (let elem of dataObj.ents.add) {
                ret += `\tclav:${elem.id} clav:pertenceTipologiaEnt clav:${dataObj.id} .\n`;
            }
        }

        return ret;
    }

    function prepWhere(dataObj) {
        let ret = "";

        if (dataObj.name) {
            ret += `\tclav:${dataObj.id} clav:entDesignacao ?n .\n`;
        }

        return ret;
    }

    var deletePart = "DELETE {\n" + prepWhere(dataObj) + prepDelete(dataObj) + "}\n";
    var inserTPart = "INSERT {\n" + prepInsert(dataObj) + "}\n";
    var wherePart = "WHERE {\n" + prepWhere(dataObj) + "}\n";

    var updateQuery = deletePart + inserTPart + wherePart;

    return client.query(updateQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in update:\n" + error));
}