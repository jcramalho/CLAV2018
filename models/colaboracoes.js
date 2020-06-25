const mongoose = require('mongoose');

const CreditoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true
    },
    filiacao: {
        type: String,           
        required: true
    },
    funcao: {
        type: String,
        required: true
    },
    desc : {
        type : String, 
        required : false
    },
    data_inicio: {
        type: String,
        required: false
    },
    data_fim: {
        type: String,
        required: false
    }
})

module.exports = mongoose.model('Colaboração', CreditoSchema, 'colaboracoes');
