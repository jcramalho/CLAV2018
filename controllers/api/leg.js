const client = require('../../config/database').onthology;
const normalize = require('../../controllers/api/utils').normalize;
const projection = require('../../controllers/api/utils').projection;
const Pedidos = require('../../controllers/api/pedidos');
const Leg = module.exports;

/**
 * @typedef {Object} Legislacao
 * @property {string} id (ex: "leg_1234")
 * @property {string} numero (ex: "2230/20")
 * @property {string} data (ex: "2018/11/26")
 * @property {string} tipo (ex: "Lei", "Deliberação", "Regulamento", "Estatuto", etc...)
 * @property {string} titulo descrição da legislação
 * @property {string} estado (ex: "Ativa", "Inativa" ou "Harmonização")
 * @property {[string]} entidades (ex: ["ent_CEE", "ent_AR"])
 */

/**
 * Lista as meta informações de todas as legislações no sistema, de acordo com
 * o filtro especificado.
 * 
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado. TODO: ainda por implementar
 * @return {Promise<[Legislacao] | Error>} promessa que quando cumprida contém a
 * lista das legislacoes existentes que respeitam o filtro dado
 */
Leg.listar = (filtro) => {
    const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?estado ?entidades WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado 'Ativo';
        OPTIONAL {
            ?uri clav:diplomaEntidade ?ent.
            ?ent clav:entSigla ?entidades;
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
    const campos = ["id", "data", "numero", "tipo", "sumario", "estado"];
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

Leg.listarAtivos = () => {
    const query = `SELECT ?id ?data ?numero ?tipo ?sumario ?entidades WHERE {
        ?uri rdf:type clav:Legislacao;
             clav:diplomaData ?data;
             clav:diplomaNumero ?numero;
             clav:diplomaTipo ?tipo;
             clav:diplomaSumario ?sumario;
             clav:diplomaEstado 'Ativo';
        OPTIONAL {
            ?uri clav:diplomaEntidade ?ent.
            ?ent clav:entSigla ?entidades;
        }
        BIND(STRAFTER(STR(?uri), 'clav#') AS ?id).
    } ORDER BY DESC (?data)`;
    const campos = ["id", "data", "numero", "tipo", "sumario"];
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

/**
 * Consulta a meta informação relativa a uma legislação
 * (tipo, data, número, título, link e entidades).
 *
 * @param {string} id código identificador da legislação (p.e, "leg_1234")
 * @return {Promise<Tipologia | Error>} promessa que quando cumprida contém a
 * legislação que corresponde ao identificador dado. Se a legislação não existir
 * então a promessa conterá o valor `undefined`
 */
Leg.consultar = id => {
    const query = `SELECT ?tipo ?data ?numero ?sumario ?link ?estado ?entidades WHERE { 
        clav:${id} a clav:Legislacao;
            clav:diplomaData ?data;
            clav:diplomaNumero ?numero;
            clav:diplomaTipo ?tipo;
            clav:diplomaSumario ?sumario;
            clav:diplomaLink ?link;
            clav:diplomaEstado ?estado;
        OPTIONAL {
            clav:${id} clav:diplomaEntidade ?ent.
            ?ent clav:entSigla ?entidades;
        }
     }`;
     const campos = ["id", "data", "numero", "tipo", "sumario", "link", "estado"];
     const agrupar = ["entidades"];

     return client.query(query)
        .execute()
        .then(response => projection(normalize(response), campos, agrupar)[0]);
};

/**
 * Insere uma nova legislação no sistema, gerando um pedido apropriado.
 * O identificador da nova legislação é gerado sequencialmente.
 * A legislação criada encontrar-se-á no estado "Harmonização".
 * 
 * @see pedidos
 *
 * @param {Legislacao} legislacao legislação que se pretende criar
 * @param {string} utilizador email do utilizador que criou a legislação
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação da nova tipologia
 */
Leg.criar = async (legislacao, utilizador) => {
    const contaQuery = `SELECT (count(distinct ?uri) as ?count) {
        ?uri rdf:type owl:NamedIndividual , clav:Legislacao.
    }`;
    const id = await client.query(contaQuery)
        .execute()
        .then(response => `leg_${normalize(response)[0].count + 1}`);
    const query = `INSERT DATA {
        clav:${id} rdf:type owl:NamedIndividual , clav:Legislacao ;
            clav:diplomaData '${legislacao.data}' ;
            clav:diplomaNumero '${legislacao.numero}' ;
            clav:diplomaTipo '${legislacao.tipo}' ;
            clav:diplomaSumario '${legislacao.sumario}' ;
            clav:diplomaEstado 'Harmonização' ;
            clav:diplomaLink '${legislacao.link}' .
        
        ${legislacao.entidades.map(entidade => `clav:${id} clav:diplomaEntidade clav:${entidade}.`).join('\n')}
    }`;
    const pedido = {
        criadoPor: utilizador,
        objeto: {
            codigo: `${id}`,
            tipo: `Legislação`,
            acao: `Criação`,
        },
        distribuicao: [{
            estado: "Submetido",
        }]
    };

    return client.query(query)
        .execute()
        .then(() => Pedidos.criar(pedido));
};

/**
 * Verifica se um determinado numero de legislação existe no sistema.
 * 
 * @param {Legislacao} legislacao
 * @return {Promise<boolean | Error>}
 */
Leg.existe = (legislacao) => {
    const query = `ASK {
            ?e clav:diplomaNumero '${legislacao.numero}'
        }`;

    return client.query(query)
        .execute()
        .then(response => response.boolean);
};

/**
 * Gera um pedido de remoção da legislação.
 * Nenhuma alteração será feita à legislação., só quando o pedido for
 * validado
 * 
 * @see pedidos
 * 
 * @param {string} id código identificador da legislação (p.e, "leg_123")
 * @param {string} utilizador email do utilizador que apagou a legislação
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a remoção da legislação
 */
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
                ?uri clav:temLegislacao clav:${id};
            } 
            UNION {
                ?crit clav:temLegislacao clav:${id} .
                ?just clav:temCriterio ?crit .
                ?aval clav:temJustificacao ?just .

                {
                    ?uri clav:temPCA ?aval ;
                } 
                UNION {
                    ?uri clav:temDF ?aval ;
                }
            }
            ?uri clav:codigo ?codigo;
                clav:titulo ?titulo;
                clav:classeStatus 'A'.

            BIND(STRAFTER(STR(?uri), 'clav#') AS ?id)
                
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
