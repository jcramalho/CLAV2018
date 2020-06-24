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
    }
})

module.exports = mongoose.model('Colaboração', CreditoSchema, 'colaboracoes');
