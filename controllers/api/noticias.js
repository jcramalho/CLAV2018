const Noticia = require('../../models/noticia');
const Noticias = module.exports;
var mongoose = require('mongoose');

Noticias.listar = (filtro) => {
    return Noticia.find(filtro).sort({data : -1});
};

Noticias.recentes = () => {
    return Noticia.aggregate([
        { $match: { ativa: true }},
        { $sort : {data : -1}},
        { $limit : 3 }
    ]).exec();
}

// Recupera a lista de notícias depois de determinada data

Noticias.getByTipo = function(data){
    return Noticia
        .find({data: {$ge: data}})
        .sort({data: -1})
        .exec()
}

Noticias.consultar = (id) => {
    return Noticia.findOne({ _id: id });
};


Noticias.update = function(id, tit, descri,date, state){
    return Noticia
        .update({_id : id}, {$set : {titulo : tit, desc : descri,data:date, ativa : state}})
        .exec()
}

Noticias.criar = n => {
    n._id = mongoose.Types.ObjectId()
    n.ativa = true
    var newNoticia = new Noticia(n);

    /*return newNoticia.save(function (err) {
        if (err) {
            console.log(err);
            return ('Ocorreu um erro a submeter a notícia! Tente novamente mais tarde');
        }
        else{
            return(newNoticia._id);
        }
    }); */
    return newNoticia.save(); 
}
