const mongoose = require('mongoose');

var FicheiroSchema = new mongoose.Schema({
    data: {
        type: String
    },
    nome: {
        type: String
    },
    path: {
        type: String
    },
    mimetype: {
        type: String
    },
    size: {
        type: Number
    }
})

const ElementoSchema = new mongoose.Schema({
    texto : {
        type: String,
        required: true
    },
    ficheiro : FicheiroSchema,
    visivel: {
        type: Boolean,
        required: true
    }
})

const EntradaSchema = new mongoose.Schema({
    descricao: {
        type: String,
        required: true
    },
    elementos : [ElementoSchema]
})

const DocApoioSchema = new mongoose.Schema({
    classe : {
        type: String,
        required: true
    },
    entradas : [EntradaSchema]
})

module.exports = mongoose.model('DocApoio', DocApoioSchema, 'docApoio');
