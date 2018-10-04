var mongo = require('mongodb');
var mongoose = require('mongoose');
var dataBases = require('../config/database');

mongoose.Promise = require('bluebird');
mongoose.connect(dataBases.userDB, {
    useMongoClient: true,
});

var db = mongoose.connection;

var PedidoSchema = mongoose.Schema({
    numero: {
        type: String,
        index: true,
        match: /\d{1,}-\d{4}/,  // O código é no formato "nr-yyyy"
    },
    criadoPor: {
        type: String,           // Email do utilizador que criou o pedido
        required: true
    },
    objeto: {
        codigo: {
            type: String,
            required: true,
        },
        tipo: {
            type: String,
            enum: ["Processo de negócio", "Tabela de seleção", "Entidade", "Legislação"],
            required: true,
        },
        acao: {
            type: String,
            enum: ["Criação", "Alteração"],
            required: true,
        },
    },
    distribuicao: [{
        estado: {
            type: String,
            enum: ["Em trabalho", "Submetido", "Em apreciação", "Em validação"],
        },
        responsavel: {
            type: String    // Email do técnico responsável pelo pedido neste estado
        },
        data: {
            type: Date,
            default: Date.now,
        },
        despacho: {
            type: String,
        }
    }]
});

var Pedido = module.exports = mongoose.model('Pedido', PedidoSchema);

module.exports.createPedido = function (newPedido, callback) {
    newPedido.save(callback);
}

module.exports.getPedidoByNumber = function (n, callback) {
    var query = { numero: n };
    Pedido.findOne(query, callback);
}

/*module.exports.getPedidosByState = function (e, callback) {
    var query = { estado: e };
    Pedido.find(query, callback);
}*/

module.exports.getPedidosByUser = function (e, callback) {
    var query = { 'criadoPor': e };
    Pedido.find(query, callback);
}

module.exports.getCountPedidos = function (callback) {
    Pedido.count({}, callback);
}