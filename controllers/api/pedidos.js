const Pedido = require("../../models/pedido");
const Pedidos = module.exports;
var Logging = require("../logging");

/**
 * Lista as informações de todas os pedidos no sistema, de acordo
 * com o filtro especificado.
 *
 * @param {Object} filtro objeto com os campos para filtrar.
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

Pedidos.getByTipo = function (tipo) {
  return Pedido.find({ tipo: tipo }).sort({ codigo: -1 }).exec();
};

/**
 * Consulta a informação relativa a um pedido.
 *
 * @param codigo código do pedido no formato "yyyy-nr" (ex: 2019-321)
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
Pedidos.criar = async function (pedidoParams) {
  var pedido = {
    estado: "Submetido",
    criadoPor: pedidoParams.user.email,
    objeto: {
      dados: pedidoParams.novoObjeto,
      dadosOriginais: pedidoParams.objetoOriginal,
      tipo: pedidoParams.tipoObjeto,
      acao: pedidoParams.tipoPedido,
    },
    distribuicao: [
      {
        estado: "Submetido",
        responsavel: pedidoParams.user.email,
        despacho: "Submissão inicial",
      },
    ],
  };

  if (pedidoParams.novoObjeto.codigo) {
    pedido.objeto.codigo = pedidoParams.novoObjeto.codigo;
  }

  if (pedidoParams.entidade) {
    pedido.entidade = pedidoParams.entidade;
  }

  var newPedido = new Pedido(pedido);

  try {
    newPedido = await newPedido.save();
    return newPedido.codigo;
  } catch (err) {
    console.log(err);
    return "Ocorreu um erro a submeter o pedido! Tente novamente mais tarde";
  }
};

/**
 * Atualiza um pedido.
 *
 * @param pedidoParams novos dados para atualizar o pedido.
 * @return {Pedido} pedido criado.
 */
Pedidos.atualizar = async function (id, pedidoParams) {
  try {
    Pedido.findByIdAndRemove(id, async function (error) {
      if (error) {
        return error;
      } else {
        var novoPedido = new Pedido(pedidoParams.pedido);
        novoPedido.distribuicao.push(pedidoParams.distribuicao);

        try {
          return await novoPedido.save();
        } catch (err) {
          console.log(err);
          return err;
        }
      }
    });
  } catch (error) {
    return error;
  }
};

/**
 * Adiciona um estado novo de distribuição ao pedido
 */
Pedidos.adicionarDistribuicao = (codigo, distribuicao) => {
  return Pedido.findOneAndUpdate(
    { codigo: codigo },
    { $push: { distribuicao: distribuicao } }
  );
};
