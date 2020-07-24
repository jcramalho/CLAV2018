const mongoose = require('mongoose');

const NotificacaoSchema = new mongoose.Schema({
    entidade: {
        type: String,
        required: true
    },
    objeto: {
        type: String,           
        required: false
    },
    acao: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    novoEstado: {
        type: String,
        required: true
    },
    realizadoPor: {
        type: String,
        required: true
    },
    responsavel: { // Email do técnico responsável pelo pedido no novo estado
        type: String,
        required: false
    },
    pedido: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('Notificacao', NotificacaoSchema, 'notificacoes');
