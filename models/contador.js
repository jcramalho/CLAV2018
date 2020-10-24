var mongoose = require('mongoose');

// Contador Schema
var ContadorSchema = mongoose.Schema({
    codigo: { type: String },
    descricao: { type: String },
    valor: { type: Number },
});

module.exports = mongoose.model('Contador', ContadorSchema, 'contadores');
