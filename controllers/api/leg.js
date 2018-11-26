const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/utils').normalize;
const projection = require('../../controllers/api/utils').projection;
const Pedidos = require('../../controllers/api/pedidos');
const Leg = module.exports;

// Lista todos os itens legislativos: id, data, numero, tipo, sumario, entidades
Leg.listar = () => {
    const query = `SELECT ?id ?data ?numero ?tipo ?titulo ?entidades WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaTitulo ?titulo.
        OPTIONAL {
            ?uri clav:diplomaEntidade ?ent.
            ?ent clav:entSigla ?entidades;
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
    const campos = ["id", "data", "numero", "tipo", "titulo"];
    const agrupar = ["entidades"];

    return client.query(query)
        .execute()
        .then(response => {
            let legs = projection(normalize(response), campos, agrupar);
            
            for (leg of legs) {
                leg.entidades = leg.entidades.map(ent => ({ id: `ent_${ent}`, sigla: ent }));
            }
        
            return legs;
        });
};

// Devolve a informação associada a um documento legislativo: tipo data numero sumario link entidades
Leg.consultar = id => {
    const query = `SELECT ?tipo ?data ?numero ?titulo ?link WHERE { 
        clav:${id} a clav:Legislacao;
            clav:diplomaData ?data;
            clav:diplomaNumero ?numero;
            clav:diplomaTipo ?tipo;
            clav:diplomaTitulo ?titulo;
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

// 
Leg.criar = async (legislacao, utilizador) => {
    const contaQuery = `SELECT (count(distinct ?uri) as ?count) {
        ?uri rdf:type owl:NamedIndividual , clav:Legislacao.
    }`;
    const id = await client.query(contaQuery)
        .execute()
        .then(response => `leg_${normalize(response)[0].count + 1}`);
    const query = `INSERT DATA {
        clav:${id} rdf:type owl:NamedIndividual ,
            clav:Legislacao ;
            clav:diplomaData '${legislacao.data}' ;
            clav:diplomaNumero '${legislacao.numero}' ;
            clav:diplomaTipo '${legislacao.tipo}' ;
            clav:diplomaTitulo '${legislacao.titulo}' ;
            clav:diplomaLink '${legislacao.link}' .
        
        ${legislacao.entidades.map(entidade => `clav:${id} clav:diplomaEntidade clav:${entidade}.`).join('\n')}
    }`;

    return client.query(query)
        .execute()
        .then(() => Pedidos.criar({
            criadoPor: utilizador,
            objeto: {
                codigo: `${id}`,
                tipo: `Legislação`,
                acao: `Criação`,
            },
            distribuicao: [{
                estado: "Submetido",
            }]
        }));
};

//
Leg.apagar = (id, utilizador) => {
    return Pedidos.criar({
        criadoPor: utilizador,
        objeto: {
            codigo: id,
            tipo: 'Legislação',
            acao: 'Remoção',
        },
        distribuicao: [{
            estado: "Submetido",
        }]
    });
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
};

/*
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
};*/
