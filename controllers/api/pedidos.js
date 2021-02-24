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

// lista dos pedidos apenas com a metainformação
Pedidos.listarMeta = (filtro) => {
  return Pedido.find(filtro, ['codigo','data','estado','criadoPor']);
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
    historico: pedidoParams.historico,
    distribuicao: [
      {
        estado: "Submetido",
        responsavel: pedidoParams.user.email,
        despacho: pedidoParams.despacho,
      },
    ],
  };

  if (pedidoParams.novoObjeto.codigo) {
    pedido.objeto.codigo = pedidoParams.novoObjeto.codigo;
  }
  
  if(pedidoParams.pedidos_dependentes) {
    pedido.pedidos_dependentes = pedidoParams.pedidos_dependentes;
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
    throw "Ocorreu um erro a submeter o pedido! Tente novamente mais tarde";
  }
};

/**
 * Atualiza um pedido.
 *
 * @param pedidoParams novos dados para atualizar o pedido.
 * @return {Pedido} Código do pedido criado.
 */
Pedidos.atualizar = async function (id, pedidoParams) {
  return new Promise((resolve, reject) => {
    Pedido.findByIdAndRemove(id, async function (error) {
      if (error) {
        reject(error);
      } else {
        var novoPedido = new Pedido(pedidoParams.pedido);
        novoPedido.distribuicao.push(pedidoParams.distribuicao);

        try {
          novoPedido = await novoPedido.save();
          resolve(novoPedido.codigo);
        } catch (err) {
          console.log(err);
          reject(err);
        }
      }
    });
  });
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

/**
 * Apaga todos os pendentes no sistema.
 *
 */
Pedidos.apagarTodos = async function () {
  await Pedido.deleteMany({}).exec();
  return "Todos os pedidos removidos com sucesso";
};
