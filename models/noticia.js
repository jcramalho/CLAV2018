const mongoose = require('mongoose');

const NoticiaSchema = new mongoose.Schema({
    data: {
        type: String,
        required: true
    },
    titulo: {
        type: String,           
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    ativa : {
        type : Boolean, 
        required : true
    }
})

module.exports = mongoose.model('Noticia', NoticiaSchema, 'noticias');
