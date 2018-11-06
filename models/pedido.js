const mongoose = require('mongoose');

const PedidoSchema = mongoose.Schema({
    codigo: {
        type: String,
        index: true,
        match: /\d{1,}-\d{4,}/,
        required: true,
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
            required: true,
        },
        responsavel: {
            type: String    // Email do técnico responsável pelo pedido neste estado
        },
        data: {
            type: Date,
            default: Date.now,
            required: true,
        },
        despacho: {
            type: String,
        }
    }]
});

PedidoSchema.pre('validate', async function(next) {
    let count = await mongoose.model('Pedido').count();
    this.codigo = `${count}-${new Date().getFullYear()}`;
    next();
});

module.exports = mongoose.model('Pedido', PedidoSchema);