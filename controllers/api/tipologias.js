const client = require('../../config/database').onthology;

var Tipologias = module.exports

Tipologias.list = function () {
    return client.query(
        `SELECT * {
            ?id rdf:type clav:TipologiaEntidade ;
                clav:tipEstado "Ativa";
                clav:tipDesignacao ?Designacao ;
                clav:tipSigla ?Sigla .
        }`
    )
        .execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Listagem: " + error);
        });
}

Tipologias.elems = function (id) {
    var fetchQuery = `
        SELECT * WHERE {
            ?id clav:pertenceTipologiaEnt clav:${id} .
            
            ?id clav:entEstado "Ativa";
                clav:entSigla ?Sigla;
                clav:entDesignacao ?Designacao.
        }
    `;

    return client.query(fetchQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Entidades que pertencem a x: " + error);
        });
}


Tipologias.stats = function (id) {
    return client.query(`
        SELECT * where {
            clav:${id} clav:tipDesignacao ?Designacao ;
                clav:tipSigla ?Sigla ;
                clav:tipEstado ?Estado ;
        }`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Dados de uma tipologia: " + error);
        });
}

Tipologias.domain = function (id) {
    var fetchQuery = `
        SELECT * WHERE {
            ?id clav:temDono clav:${id} ;
                clav:codigo ?Code ;
                clav:titulo ?Title ;
                clav:pertenceLC clav:lc1 ;
                clav:classeStatus "A" .
        }
    `;

    return client.query(fetchQuery)
        .execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Dominio de uma tipologia: " + error);
        });
}

Tipologias.participations = function (id) {
    var fetchQuery = `
        select * where { 
            ?id clav:temParticipante clav:${id} ;
                ?Type clav:${id} ;
            
                clav:titulo ?Title ;
                clav:codigo ?Code ;
                clav:pertenceLC clav:lc1 ;
                clav:classeStatus "A" .
            
            filter (?Type!=clav:temParticipante && ?Type!=clav:temDono)
        }`
        ;

    return client.query(fetchQuery)
        .execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error("Participações de uma tipologia: " + error);
        });
}

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