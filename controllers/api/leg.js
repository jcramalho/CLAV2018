const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/utils').normalize;
const Pedidos = require('../../controllers/api/pedidos');
const Leg = module.exports;

// Lista todos os itens legislativos: id, data, numero, tipo, sumario, entidades
Leg.listar = () => {
    const query =
        `SELECT  
            ?id ?data ?numero ?tipo ?sumario
            (GROUP_CONCAT(CONCAT(STR(?ent),"::",?entSigla); SEPARATOR=";") AS ?entidades)
        WHERE { 
            ?id rdf:type clav:Legislacao;
                clav:diplomaData ?data;
                clav:diplomaNumero ?numero;
                clav:diplomaTipo ?tipo;
                clav:diplomaTitulo ?sumario.
            optional{
                ?id clav:diplomaEntidade ?ent.
                ?ent clav:entSigla ?entSigla;
            }
        }
        Group by ?id ?data ?numero ?tipo ?sumario
        Order by desc (?data)`

        return client.query(query)
            .execute()
            .then(response => normalize(response));
}

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
Leg.consultar = id => {
    const query = `SELECT ?tipo ?data ?numero ?sumario ?link WHERE { 
        clav:${id} a clav:Legislacao;
            clav:diplomaData ?data;
            clav:diplomaNumero ?numero;
            clav:diplomaTipo ?tipo;
            clav:diplomaTitulo ?sumario;
            clav:diplomaLink ?link;
     }`;

    const entidadesQuery = `SELECT ?ent ?entSigla ?entDesignacao {
        clav:${id} clav:diplomaEntidade ?ent .
        ?ent clav:entSigla ?entSigla .
        ?ent clav:entDesignacao ?entDesignacao
    }`;

    return client.query(query)
        .execute()
        .then(leg_response => client.query(entidadesQuery)
            .execute()
            .then((ent_response) => {
                const legislacao = normalize(leg_response)[0];
                legislacao.entidades = normalize(ent_response);
                return legislacao;
            }));
};

// Devolve a lista de processos regulados pelo documento: id, codigo, titulo
Leg.regula = id => {
    var query = `
        SELECT DISTINCT ?id ?codigo ?titulo WHERE { 
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
            ?id clav:codigo ?codigo;
                clav:titulo ?titulo;
                clav:classeStatus 'A'.
                
        } ORDER BY ?codigo
    `
    return client.query(query)
        .execute()
        .then(response => normalize(response));
}

// Devolve o número de documentos legislativos catalogados para efeitos de geração dum novo id ou de contagem
Leg.ultNum = ()=>{
    var query = `
        select (count (?s) as ?num)  where { 
            ?s a clav:Legislacao .
        }`
    return client.query(query)
        .execute()
        .then(response => normalize(response));
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

Leg.createDoc = function (novoId, dataObj) {
    var createQuery = `
        INSERT DATA {
            clav:${novoId} rdf:type owl:NamedIndividual ,
                    clav:Legislacao ;
                clav:diplomaData '${dataObj.Data}' ;
                clav:diplomaNumero '${dataObj.Numero}' ;
                clav:diplomaTipo '${dataObj.Tipo}' ;
                clav:diplomaTitulo '${dataObj.Titulo}' ;
                clav:diplomaLink '${dataObj.Link}' .
    `;

    for(org of dataObj.Orgs){
        createQuery += `
            clav:${novoId} clav:diplomaEntidade clav:${org}.
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