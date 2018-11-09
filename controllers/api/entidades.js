const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/aux').normalize;
const Pedidos = require('../../controllers/api/pedidos');
const Entidades = module.exports;

/**
 * 
 * @param {Object} filtro
 * @param {string} filtro.sigla
 * @param {string} filtro.designacao
 * @param {string} filtro.internacional "Sim" ou "Não"
 * @param {string} filtro.estado "Ativa"
 * @return {Promise<[Entidade]|Error>}
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
 * 
 * @param {string} id
 * @return {Promise<[Tipologia|Error]>}
 */
Entidades.tipologias = (id) => {
    const query = `SELECT ?sigla ?designacao WHERE {
        clav:${id} clav:pertenceTipologiaEnt ?id .
            
        ?id clav:tipEstado "Ativa";
            clav:tipSigla ?sigla;
            clav:tipDesignacao ?designacao.
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

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

Entidades.criar = (entidade) => {
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
            criadoPor: 'a70387@alunos.uminho.pt',
            objeto: {
                codigo: entidade.sigla,
                tipo: 'Entidade',
                acao: 'Criação',
            },
            distribuicao: []
        }));
};

Entidades.dono = (id) => {
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

Entidades.participante = (id) => {
    const query = `SELECT ?codigo ?titulo WHERE { 
        ?id clav:temParticipante clav:${id} ;
            ?Type clav:${id} ;
            clav:titulo ?titulo ;
            clav:codigo ?codigo ;
            clav:pertenceLC clav:lc1 ;
            clav:classeStatus "A" .
            
        FILTER (?Type != clav:temParticipante && ?Type != clav:temDono)
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};
