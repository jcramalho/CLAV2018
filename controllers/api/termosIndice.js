const execQuery = require('../../controllers/api/utils').execQuery
const normalize = require('../../controllers/api/utils').normalize;
const Pedidos = require('../../controllers/pedidos');
var TermosIndice = module.exports

/**
 * @typedef {Object} TermoIndice
 * @property {string} id (ex: "ti_c350.10.506_1")
 * @property {string} termo (ex: "Abandono escolar")
 * @property {string} idClasse (ex: "c650.20.001")
 * @property {string} codigoClasse (ex: "650.20.001")
 * @property {string} tituloClasse (ex: "Sinalização e encaminhamento em situações de vulnerabilidade")
 */

/**
 * Lista os termos de índice registados no sistema.
 * 
 * @return {Promise<[TermoIndice] | Error>} promessa que quando cumprida contém a
 * lista dos termos de índice
 */
TermosIndice.listar = () => {
    let query = `
        SELECT ?id ?termo ?idClasse ?tituloClasse ?estado
        WHERE { 
            ?idTI rdf:type clav:TermoIndice ;
                clav:termo ?termo ;
                clav:estado ?estado;
                clav:estaAssocClasse ?idC .
            ?idC clav:titulo ?tituloClasse ;
                clav:codigo ?idClasse.
            BIND(STRAFTER(STR(?idTI), "clav#") AS ?id)
        }
        ORDER BY ?termo`;

    return execQuery(query)
        .then(response => normalize(response));
}

// Testa a existência de um determinado TI
TermosIndice.existe = (termoIndice) => {
    const query = `
        ASK { 
            ?s rdf:type clav:TermoIndice.
            ?s clav:termo "${termoIndice.termo}"
        }`;
    return execQuery(query)
        .then(response => {return (response.boolean)});
}

TermosIndice.assocClasse = classe => {
    let query = `
        SELECT ?id ?termo WHERE { 
            ?idTI rdf:type clav:TermoIndice ;
                clav:termo ?termo ;
                clav:estaAssocClasse clav:${classe} .
            BIND (STRAFTER(STR(?idTI), 'clav#') AS ?id).
        }
        ORDER BY ?termo`;

    return execQuery(query)
        .then(response => normalize(response));
}

TermosIndice.lastID = function () {
    let fetchQuery = `
        SELECT * WHERE { 
            ?id rdf:type clav:TermoIndice
        } ORDER BY DESC(?id)
        LIMIT 1
    `;

    return execQuery(fetchQuery)
        //getting the content we want
        .then(response => Promise.resolve(response.results.bindings[0]))
        .catch(function (error) {
            console.error(error);
        });
}

TermosIndice.contar = function() {
    let query = `
        SELECT (count (?s) as ?num) WHERE { 
            ?s rdf:type clav:TermoIndice
        }
    `;

    return execQuery(query)
        .then(response => normalize(response));
}

/**
 * Insere um novo termo de indice no sistema, gerando um pedido apropriado.
 * O TI criado encontrar-se-á no estado "Harmonização".
 * NOTA: Esta função altera sempre o estado da base de dados, devendo-se por
 * isso verificar primeiro se o identificador da entidade a inserir ainda não
 * se encontra em uso.
 * 
 * @see pedidos 
 * 
 * @param {TermosIndice}  termoIndice termos de indice que se pretende criar
 * @param {string} utilizador email do utilizador que criou a entidade
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido gerado para a criação de novo termo de indice
 */
TermosIndice.criar = async (termoIndice, utilizador) => {
    const nanoid = require('nanoid')
    const id = "ti_" + nanoid();

    termoIndice.codigo = id;

    Pedidos.criar('Criação', 'Termo de Indice', termoIndice, utilizador);
};

//Criar controller para inserir na base de dados, depois do pedido aprovado!!
/*
const query = `INSERT DATA {
    clav:${id} rdf:type owl:NamedIndividual , clav:TermoIndice;
        clav:termo '${termoIndice.termo}';
        clav:estado 'Harmonização' ;
        clav:estaAssocClasse '${termoIndice.idClasse}' .
}`;

return execQuery(query)
    .then(() => Pedidos.criar(pedido));*/
