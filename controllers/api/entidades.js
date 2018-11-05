const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/aux').normalize;
const Entidades = module.exports;

Entidades.listar = () => {
    const query = `SELECT ?sigla ?designacao ?internacional {
        ?id rdf:type clav:Entidade ;
            clav:entEstado "Ativa";
            clav:entDesignacao ?designacao ;
            clav:entSigla ?sigla ;
            clav:entInternacional ?internacional.
    }`;

    return client.query(query)
        .execute()
        .then(response => Promise.resolve(normalize(response)))
        .catch(function(error) {
            console.error(`Listagem: ${error}`);
        });
};

Entidades.tipologias = (id) => {
    const query = `SELECT ?sigla ?designacao WHERE {
        clav:${id} clav:pertenceTipologiaEnt ?id .
            
        ?id clav:tipEstado "Ativa";
            clav:tipSigla ?sigla;
            clav:tipDesignacao ?designacao.
    }`;

    return client.query(query)
        .execute()
        .then(response => Promise.resolve(normalize(response)))
        .catch(function(error) {
            console.error(`Tipologias a que x pertence: ${error}`);
        });
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
        .then(response => Promise.resolve(normalize(response)[0]))
        .catch(function(error) {
            console.error(`Erro na consulta de uma entidade: ${error}`);
        });
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
        .then(response => Promise.resolve(normalize(response)))
        .catch(function(error) {
            console.error(`Dominio de org: ${error}`);
        });
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
        .then(response => Promise.resolve(normalize(response)))
        .catch(function(error) {
            console.error(`Erro no acesso ao GraphDB, participações de uma entidade: ${error}`);
        });
};
