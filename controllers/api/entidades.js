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
        .then(response => normalize(response));
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
