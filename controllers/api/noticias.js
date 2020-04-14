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

Noticias.eliminar = function(id, callback){
    Noticia.findOneAndRemove({_id: id}, function(err, noticia){
        if (err) {	
            callback(err, null);
        } else if(!noticia){
            try{
                id = mongoose.Types.ObjectId(id)
                Noticia.findOneAndRemove({_id: id}, function(err2, noticia2){
                    if(err2){
                        callback(err2, null);
                    }else{
                        callback(null, noticia2);
                    }
                })
            }catch(e){
                callback("Notícia não existe", null)
            }
        } else {
		    callback(null, noticia);
        }
    });
}
