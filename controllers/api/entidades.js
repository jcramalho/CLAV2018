const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/utils').normalize;
const Pedidos = require('../../controllers/api/pedidos');
const Entidades = module.exports;

/**
 * @typedef {Object} Entidade
 * @property {string} sigla (ex: "AR")
 * @property {string} designacao (ex: "Assembleia da República")
 * @property {string} internacional (ex: "Sim" ou "Não")
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
 * @param {string} filtro.estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @return {Promise<[Entidade] | Error>} promessa que quando cumprida contém a
 * lista das entidades existentes que respeitam o filtro dado
 */
Entidades.listar = (filtro) => {
    const query = `SELECT ?id ?sigla ?designacao ?internacional ?estado {
        ?id rdf:type clav:Entidade ;
            clav:entEstado ?estado;
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entInternacional ?internacional.

        FILTER (${Object.entries(filtro)
            .filter(([k,v]) => v !== undefined)
            .map(([k,v]) => `?${k} = "${v}"` )
            .join(' && ')})
    } ORDER BY ?sigla`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

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
        clav:${id} clav:pertenceTipologiaEnt ?id .
            
        ?id clav:tipEstado "Ativa";
            clav:tipSigla ?sigla;
            clav:tipDesignacao ?designacao.
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

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
    const query = `SELECT ?sigla ?designacao ?estado ?internacional WHERE {
        clav:${id} rdf:type clav:Entidade ;
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entEstado ?estado ;
            clav:entInternacional ?internacional .
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response)[0]);
};

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
    }`;

    return client.query(query)
        .execute()
        .then(response => response.boolean);
};

/**
 * Insere uma nova entidade no sistema, gerando um pedido apropriado.
 * A entidade criada encontrar-se-á no estado "Harmonização".
 * NOTA: Esta função altera sempre o estado da base de dados, devendo-se por
 * isso verificar primeiro se o identificador da entidade a inserir ainda não
 * se encontra em uso.
 * 
 * @see pedidos 
 * 
 * @param {Entidade} entidade entidade que se pretende criar
 * @param {string} utilizador email do utilizador que criou a entidade
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação da nova entidade
 */
Entidades.criar = (entidade, utilizador) => {
    const query = `INSERT DATA {
        clav:ent_${entidade.sigla} rdf:type owl:NamedIndividual , clav:Entidade;
            clav:entDesignacao '${entidade.designacao}' ;
            clav:entSigla '${entidade.sigla}' ;
            clav:entInternacional '${entidade.internacional}' ;
            ${entidade.tipologias.map(tipologia => `clav:pertenceTipologiaEnt clav:${tipologia.id} ;`).join('\n')}
            clav:entEstado 'Harmonização' .
    }`;

    return client.query(query)
        .execute()
        .then(() => Pedidos.criar({
            criadoPor: utilizador,
            objeto: {
                codigo: `ent_${entidade.sigla}`,
                tipo: 'Entidade',
                acao: 'Criação',
            },
            distribuicao: [{
                estado: "Submetido",
            }]
        }));
};

/**
 * 
 * @param id
 * @param utilizador
 */
Entidades.aceitar_criacao = (id, pedido, utilizador) => {
    const query = `DELETE {
        clav:${id} clav:entEstado "Harmonização" .
    } INSERT {
        clav:${id} clav:entEstado "Ativa" .
    } WHERE {
        clav:${id} clav:entEstado ?status .
    }`;

   // Pedidos.adicionar_distribuicao(pedido, )
};

/**
 * 
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @param {string} utilizador email do utilizador que apagou a entidade
 * @return {Promise<Pedido | Error>}
 */
Entidades.apagar = (id, utilizador) => {
    const query = `DELETE {
        clav:${id} clav:entEstado ?status .
    } INSERT {
        clav:${id} clav:entEstado 'Inativa' .
    } WHERE {
        clav:${id} clav:entEstado ?status .
    }`;

    return client.query(query)
        .execute()
        .then(() => Pedidos.criar({
            criadoPor: utilizador,
            objeto: {
                codigo: id,
                tipo: 'Entidade',
                acao: 'Remoção',
            },
            distribuicao: [{
                estado: "Submetido",
            }]
        }));
};

/**
 * Lista os processos em que uma entidade intervem como dona.
 * 
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<{codigo: string, titulo: string} | Error>} promessa que
 * quando cumprida contém os códigos e títulos dos processos onde a entidade
 * participa como donas
 */
Entidades.dono = id => {
    const query = `SELECT ?codigo ?titulo WHERE {
        ?id clav:temDono clav:${id} ;
            clav:codigo ?codigo ;
            clav:titulo ?titulo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

/**
 * Lista os processos em que uma entidade intervem como participante.
 *
 * @param {string} id código identificador da entidade (p.e, "ent_CEE")
 * @return {Promise<[{codigo: string, titulo: string}] | Error>} promessa que
 * quando cumprida contém os códigos e títulos dos processos onde a entidade
 * participa
 */
Entidades.participante = id => {
    const query = `SELECT ?tipoPar ?codigo ?titulo WHERE { 
        ?id clav:temParticipante clav:${id} ;
            ?tipoPar clav:${id} ;
            clav:titulo ?titulo ;
            clav:codigo ?codigo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
            
        FILTER (?tipoPar != clav:temParticipante && ?tipoPar != clav:temDono)
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};
