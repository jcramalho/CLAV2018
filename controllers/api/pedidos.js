const Pedido = require('../../models/pedido');
const Pedidos = module.exports;

Pedidos.listar = () => {
    return Pedido.find();
};

Pedidos.consultar = (codigo) => {
    return Pedido.findOne({ codigo: codigo });
};

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
