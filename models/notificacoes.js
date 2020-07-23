const mongoose = require('mongoose');

const NotificacaoSchema = new mongoose.Schema({
    entidade: {
        type: String,
        required: true
    },
    pedido: {
        type: String,           
        required: true
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
    responsavel: { // Email do técnico responsável pelo pedido no novo estado
        type: String,
        required: false
    }
})

module.exports = mongoose.model('Notificacao', NotificacaoSchema, 'notificacoes');
