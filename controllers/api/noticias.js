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

Noticias.append = async function(dados){ 
    // Converter IDs para o tipo do mongoose
    dados.forEach(elem => {
        elem._id = mongoose.Types.ObjectId(elem._id.$oid);
    })
    try{
        await new Promise((resolve, reject) => {
            // ordered a false permite que caso aconteça erro a inserir o elemento N, os restantes elementos podem ser inseridos
            Noticia.insertMany(dados, { ordered : false }, function(err,result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result);
                }
            })
        })
    }catch(err){
        throw(`Erro na importação das notícias. Apenas foram registadas as notícias sem erros. Foram inseridas ${err.insertedDocs.length} notícias de ${dados.length}.`);
    }
    return "Notícias importadas com sucesso!"
}

Noticias.replace = async function(dados){
    // Converter IDs para o tipo do mongoose
    dados.forEach(elem => {
        elem._id = mongoose.Types.ObjectId(elem._id.$oid);
    })
    // Apaga todos os registos
    try {
        await new Promise((resolve, reject) => {
            Noticia.deleteMany({}, function(err) {
                if(err){
                    reject(err)
                }
                else {
                    // ordered a false permite que caso aconteça erro a inserir o elemento N, os restantes elementos podem ser inseridos
                    Noticia.insertMany(dados, { ordered : false }, function(err,result) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(result);
                        }
                    })
                }
            });
        })
    }catch(err){
        throw(`Erro na importação das notícias. Apenas foram registadas as notícias sem erros. Foram inseridas ${err.insertedDocs.length} notícias de ${dados.length}.`);
    }
    return "Notícias importadas com sucesso!"
}