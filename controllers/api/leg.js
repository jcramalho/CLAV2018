const client = require('../../config/database').onthology;

var Leg = module.exports

Leg.list = function () {
    return client.query(
        `SELECT  
            ?id ?Data ?Número ?Tipo ?Titulo
            (GROUP_CONCAT(CONCAT(STR(?Ent),"::",?EntSigla); SEPARATOR=";") AS ?Entidades)
        WHERE { 
            ?id rdf:type clav:Legislacao;
                clav:diplomaData ?Data;
                clav:diplomaNumero ?Número;
                clav:diplomaTipo ?Tipo;
                clav:diplomaTitulo ?Titulo.
            optional{
                ?id clav:diplomaEntidade ?Ent.
                ?Ent clav:orgSigla ?EntSigla;
            }
        }
        Group by ?id ?Data ?Número ?Tipo ?Titulo`
    )
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

Leg.stats = function (id) {
    var fetchQuery = `
        SELECT  
            ?Data ?Número ?Tipo ?Titulo ?Link
            (GROUP_CONCAT(CONCAT(STR(?Ent),"::",?EntSigla,"::",?EntNome); SEPARATOR=";") AS ?Entidades)
        WHERE { 
            clav:${id} clav:diplomaData ?Data;
                clav:diplomaNumero ?Número;
                clav:diplomaTipo ?Tipo;
                clav:diplomaTitulo ?Titulo;
                clav:diplomaLink ?Link;

            OPTIONAL{
                clav:${id} clav:diplomaEntidade ?Ent.
                ?Ent clav:orgSigla ?EntSigla;
                     clav:orgNome ?EntNome.
            }
        } GROUP BY ?Data ?Número ?Tipo ?Titulo ?Link
    `;

    return client.query(fetchQuery)
        .execute()
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

Leg.regulates = function (id) {
    var fetchQuery = `
        SELECT DISTINCT ?id ?Code ?Title WHERE { 
            {
                ?id clav:temLegislacao clav:${id};
            } 
            UNION {
                ?crit clav:temLegislacao clav:${id} .
                ?just clav:temCriterio ?crit .
                ?aval clav:temJustificacao ?just .

                {
                    ?id clav:temPCA ?aval ;
                } 
                UNION {
                    ?id clav:temDF ?aval ;
                }
            }
            ?id clav:codigo ?Code;
                clav:titulo ?Title;
                clav:classeStatus 'A'.
                
        } ORDER BY ?Code
    `;

    return client.query(fetchQuery).execute()
        .then(response => Promise.resolve(response.results.bindings))
        .catch(function (error) {
            console.error(error);
        });
}

Leg.checkNumberAvailability = function (number) {
    var checkQuery = `
            SELECT (count(*) AS ?Count) WHERE {
                ?leg rdf:type clav:Legislacao ;
                    clav:diplomaNumero '${number}'
            }
        `;

    return client.query(checkQuery).execute()
        //Getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0].Count.value))
        .catch(function (error) {
            console.error("Error in check:\n" + error);
        });
}

Leg.createDoc = function (newID, dataObj) {
    var createQuery = `
        INSERT DATA {
            clav:${newID} rdf:type owl:NamedIndividual ,
                    clav:Legislacao ;
                clav:diplomaData '${dataObj.Data}' ;
                clav:diplomaNumero '${dataObj.Numero}' ;
                clav:diplomaTipo '${dataObj.Tipo}' ;
                clav:diplomaTitulo '${dataObj.Titulo}' ;
                clav:diplomaLink '${dataObj.Link}' .
    `;

    for(org of dataObj.Orgs){
        createQuery += `
            clav:${newID} clav:diplomaEntidade clav:${org}.
        `;    
    }

    createQuery += `
        }
    `;

    
    return client.query(createQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in create:\n" + error));
}

Leg.updateDoc = function (dataObj) {

    var del = "";
    var ins = "";
    var wer = "";

    if (dataObj.year) {
        del += `clav:${dataObj.id} clav:diplomaAno ?y .\n`;
        ins += `clav:${dataObj.id} clav:diplomaAno "${dataObj.year}" .\n`;
    }
    if (dataObj.date) {
        del += `clav:${dataObj.id} clav:diplomaData ?d .\n`;
        ins += `clav:${dataObj.id} clav:diplomaData "${dataObj.date}" .\n`;
    }
    if (dataObj.number) {
        del += `clav:${dataObj.id} clav:diplomaNumero ?n .\n`;
        ins += `clav:${dataObj.id} clav:diplomaNumero "${dataObj.number}" .\n`;
    }
    if (dataObj.type) {
        del += `clav:${dataObj.id} clav:diplomaTipo ?t .\n`;
        ins += `clav:${dataObj.id} clav:diplomaTipo "${dataObj.type}" .\n`;
    }
    if (dataObj.title) {
        del += `clav:${dataObj.id} clav:diplomaTitulo ?tit .\n`;
        ins += `clav:${dataObj.id} clav:diplomaTitulo "${dataObj.title}" .\n`;
    }
    if (dataObj.link) {
        del += `clav:${dataObj.id} clav:diplomaLink ?l .\n`;
        ins += `clav:${dataObj.id} clav:diplomaLink "${dataObj.link}" .\n`;
    }

    if (dataObj.org && dataObj.org.length) {
        del += `clav:${dataObj.id} clav:diplomaEntidade ?org .\n`;

        for(let ent of dataObj.org){
            ins += `clav:${dataObj.id} clav:diplomaEntidade clav:${ent}.\n`;    
        }        
    }

    wer = "WHERE {\n" + del + "}\n";
    del = "DELETE {\n" + del + "}\n";
    ins = "INSERT {\n" + ins + "}\n";

    var updateQuery = del + ins + wer;
    
    console.log(updateQuery);

    return client.query(updateQuery).execute()
        .then(response => Promise.resolve(response))
        .catch(error => console.error("Error in update:\n" + error));
}

Leg.deleteDoc = function (id) {
    return client.query(`
                DELETE {
                    clav:${id} ?o ?p
                }
                WHERE { ?s ?o ?p }
            `).execute()
        //getting the content we want
        .then(response => Promise.resolve(response))
        .catch(function (error) {
            console.error(error);
        });
}