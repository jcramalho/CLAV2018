const mongoose = require('mongoose');

var FicheiroSchema = new mongoose.Schema({
    data: String,
    nome: String,
    path: String,
    mimetype: String,
    size: Number
})

const DocSchema = new mongoose.Schema({
    classe : {
        type: String,
        required: true
    },
    titulo : {
        type: String,
        required: true
    },
    url : {
        type: String,
        required: true
    },
    local : {
        type: String
    },
    autores : [String],
    ano: {
        type: String,
        required: true
    },
    ficheiro: FicheiroSchema,
    visivel: {
        type: Boolean,
        required: true
    }
})

module.exports = mongoose.model('ProdCientifica', DocSchema, 'prodCientifica');
