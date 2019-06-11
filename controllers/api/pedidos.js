const Pedido = require('../../models/pedido');
const Pedidos = module.exports;
var Logging = require('../logging');

/**
 * Lista as informações de todas os pedidos no sistema, de acordo
 * com o filtro especificado.
 * 
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.criadoPor
 * @param {string} filtro.objeto.codigo
 * @param {string} filtro.objeto.tipo
 * @param {string} filtro.objeto.acao
 * @return {Promise<[Pedido] | Error>} promessa que quando cumprida possui a
 * lista dos pedidos que satisfazem as condições do filtro
 */
Pedidos.listar = (filtro) => {
    return Pedido.find(filtro);
};

// Recupera a lista de pedidos de determinado tipo

Pedidos.getByTipo = function(tipo){
    return Pedido
        .find({tipo: tipo})
        .sort({codigo: -1})
        .exec()
}

/**
 * Consulta a informação relativa a um pedido.
 * 
 * @param codigo código do pedido no formato "nr-yyyy" (ex: 321-2019)
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pedido com o código especificado, ou `undefined` se o pedido não existe.
 */
Pedidos.consultar = (codigo) => {
    return Pedido.findOne({ codigo: codigo });
};

/**
 * Cria um novo pedido no sistema.
 * 
 * @param pedido novo pedido a inserir no sistema.
 * @return {Pedido} pedido criado.
 */
Pedidos.criar = function(pedidoParams){
    var newPedido = new Pedido({
        estado: "Submetido",
        criadoPor: pedidoParams.user.email,
        objeto: {
            codigo: pedidoParams.novoObjeto.codigo,
            dados: pedidoParams.novoObjeto,
            tipo: pedidoParams.tipoObjeto,
            acao: pedidoParams.tipoPedido
        },
        distribuicao: [{
            estado: "Submetido",
            responsavel: pedidoParams.utilizador,
            despacho: "Submissão inicial"
        }]
    });

    return newPedido.save(function (err) {
        if (err) {
            console.log(err);
            return ('Ocorreu um erro a submeter o pedido! Tente novamente mais tarde');
        }
        else{
            return(newPedido.codigo);
        }
    });
}

/**
 * Adiciona um estado novo de distribuição ao pedido
 */
Pedidos.adicionarDistribuicao = (codigo, distribuicao) => {
    return Pedido.findOneAndUpdate({ codigo: codigo }, { $push: { distribuicao: distribuicao } });
}