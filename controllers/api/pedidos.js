var Pedido = require('../../models/pedido');

var Pedidos = module.exports;

Pedidos.listar = (req, res) => {
    Pedido.find({}, (err, pedidos) => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.json(pedidos);
        }
    });
};

Pedidos.criar = (req, res) => {
    var pedido = new Pedido({
        numero: req.body.numero,
        criadoPor: req.body.criadoPor,
        objeto: {
            codigo: req.body.objeto.codigo,
            tipo: req.body.objeto.tipo,
            acao: req.body.objeto.acao,
        },
        distribuicao: req.body.distribuicao
    });

    pedido.save(err => {
        if (err) {
            res.sendStatus(500);
        } else {
            res.status(201).json(pedido);
        }
    });
};

Pedidos.detalhar = (req, res) => {
    Pedido.findOne({ 'numero': req.params.numero }, (err, pedido) => {
        if (err) {
            res.sendStatus(500);
        } else if (pedido === null) {
            res.sendStatus(404);
        } else {
            res.json(pedido);
        }
    });
};