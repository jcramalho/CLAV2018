const Pedido = require('../../models/pedido');
const Pedidos = module.exports;

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
    // Remover campos vazios do filtro
    Object.keys(filtro).forEach((key) => (filtro[key] === undefined) && delete filtro[key]);
    return Pedido.find(filtro);
};

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
Pedidos.criar = (pedido) => {
    return new Pedido({
        criadoPor: pedido.criadoPor,
        objeto: {
            codigo: pedido.objeto.codigo,
            tipo: pedido.objeto.tipo,
            acao: pedido.objeto.acao,
        },
        distribuicao: pedido.distribuicao,
    }).save();
};
