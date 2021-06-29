const Pedido = require("../../models/pedido");
const Notificacao = require("../../models/notificacoes");
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
Pedidos.listarMeta = () => {
  return Pedido.find({}, [
    "codigo",
    "data",
    "objeto.tipo",
    "objeto.acao",
    "estado",
    "criadoPor",
    "entidade",
  ]);
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
Pedidos.consultar = async (codigo) => {
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

  if (pedidoParams.pedidos_dependentes) {
    pedido.pedidos_dependentes = pedidoParams.pedidos_dependentes;
  }

  if (pedidoParams.entidade) {
    pedido.entidade = pedidoParams.entidade;
  }

  var newPedido = new Pedido(pedido);

  try {
    newPedido = await newPedido.save();
    const notificacao = {
      entidade: pedidoParams.entidade,
      pedido: newPedido.codigo,
      acao: pedidoParams.tipoPedido,
      tipo: pedidoParams.tipoObjeto,
      novoEstado: "Submetido",
      criadoPor: pedidoParams.user.email,
    };

    var newNotificacao = new Notificacao(notificacao);

    try {
      newNotificacao = await newNotificacao.save();
    } catch (err) {
      console.log(err);
      throw "Ocorreu um erro a submeter a notificação! Tente novamente mais tarde";
    }

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
  return new Promise(async (resolve, reject) => {
    var pedido = await Pedido.findOne({ codigo: pedidoParams.pedido.codigo });
    Pedido.findByIdAndRemove(id, async function (error) {
      if (error) {
        reject(error);
      } else {
        var novoPedido = JSON.parse(JSON.stringify(pedido));
        delete novoPedido._id;
        novoPedido.estado = pedidoParams.pedido.estado;
        if (pedidoParams.pedido.estado == "Distribuído" || pedidoParams.pedido.estado == "Devolvido") {
          novoPedido.historico.push(
            novoPedido.historico[novoPedido.historico.length - 1]
          );
          novoPedido.objeto.acao = pedidoParams.pedido.objeto.acao;
        } else {
          novoPedido.objeto = pedidoParams.pedido.objeto;
          novoPedido.historico = pedidoParams.pedido.historico;
        }

        novoPedido.distribuicao.push(pedidoParams.distribuicao);
        const notificacao = {
          entidade: pedidoParams.pedido.entidade,
          pedido: pedidoParams.pedido.codigo,
          acao: pedidoParams.pedido.objeto.acao,
          tipo: pedidoParams.pedido.objeto.tipo,
          novoEstado: pedidoParams.pedido.estado,
          criadoPor: pedidoParams.pedido.criadoPor,
          responsavel: pedidoParams.distribuicao.proximoResponsavel
            ? pedidoParams.distribuicao.proximoResponsavel.nome
            : pedidoParams.distribuicao.responsavel,
        };
        var newNotificacao = new Notificacao(notificacao);

        try {
          newNotificacao = await newNotificacao.save();

          try {
            novoPedido = await new Pedido(novoPedido).save();
            resolve(novoPedido.codigo);
          } catch (err) {
            console.log(err);
            reject(err);
          }
        } catch (err) {
          console.log(err);
          throw "Ocorreu um erro a submeter a notificação! Tente novamente mais tarde";
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
