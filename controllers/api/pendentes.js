const Pendente = require('../../models/pendente');
const Pendentes = module.exports;
var Logging = require('../logging');

/**
 * Lista as informações de todas os trabalhos pendentes no sistema, de acordo
 * com o filtro especificado.
 * 
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.criadoPor
 * @param {string} filtro.tipo
 * @param {string} filtro.acao
 * @return {Promise<[Pedido] | Error>} promessa que quando cumprida possui a
 * lista dos pedidos que satisfazem as condições do filtro
 */
Pendentes.listar = (filtro) => {
    // Remover campos vazios do filtro
    Object.keys(filtro).forEach((key) => (filtro[key] === undefined) && delete filtro[key]);
    return Pendente.find(filtro);
};

Pendentes.listarTodos = () => {
    return Pendente.find().sort({data: -1});
};

// Recupera a lista de trabalhos pendentes de determinado tipo

Pendentes.getByTipo = function(tipo){
    return Pendente
        .find({tipo: tipo})
        .sort({data: -1})
        .exec()
}

/**
 * Consulta a informação relativa a um trabalho pendente.
 * 
 * @param codigo código do pendente proveniente do campo _id do mongo
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pendente com o código especificado, ou `undefined` se o pendente não existe.
 */
Pendentes.consultar = (codigo) => {
    return Pendente.findOne({ codigo: codigo });
};

/**
 * Cria um novo pendente no sistema.
 * 
 * @param pendente novo a inserir no sistema.
 * @return {Pendente} pendente criado.
 */
Pendentes.criar = function(pendente){
    var newPendente = new Pendente(pendente);

    return newPendente.save(function (err) {
        if (err) {
            console.log(err);
            return ('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
        }
        else{
            return(newPendente);
        }
    });
}
