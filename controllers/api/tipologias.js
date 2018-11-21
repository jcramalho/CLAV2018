const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/utils').normalize;

var Tipologias = module.exports;

Tipologias.listar = () => {
    const query = `SELECT ?id ?designacao ?sigla {
        ?uri rdf:type clav:TipologiaEntidade ;
            clav:tipEstado "Ativa";
            clav:tipDesignacao ?designacao ;
            clav:tipSigla ?sigla .
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
    }`;

    return client.query(query)
        .execute()
        .then(response => normalize(response));
};

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

Tipologias.createTipologia = function (id, name, initials) {
    var createQuery = `
        INSERT DATA {
            clav:${id} rdf:type owl:NamedIndividual ,
                    clav:TipologiaEntidade ;
                clav:tipDesignacao '${name}' ;
                clav:tipSigla '${initials}' ;
                clav:tipEstado "Harmonização" .
        }
    `;

    console.log(createQuery);

    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
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

        if (dataObj.elems.del && dataObj.elems.del.length) {
            for (let elem of dataObj.elems.del) {
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

        if (dataObj.elems.add && dataObj.elems.add.length) {
            for (let elem of dataObj.elems.add) {
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

Tipologias.deleteTipologia = function (id) {
    /*var deleteQuery = `
        DELETE {
            clav:${id} ?o ?p .
            ?s ?o clav:${id}
        }
        WHERE { ?s ?o ?p }
    `;*/

    var deleteQuery = `
        DELETE {
            clav:${id} clav:tipEstado ?status .
        }
        INSERT {
            clav:${id} clav:tipEstado 'Inativa' .
        }
        WHERE {
            clav:${id} clav:tipEstado ?status .
        }
    `;

    return client.query(deleteQuery).execute()
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}