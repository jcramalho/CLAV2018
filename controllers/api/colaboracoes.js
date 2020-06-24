const Credito = require('../../models/colaboracoes');
const Creditos = module.exports;
var mongoose = require('mongoose');

Creditos.listar = (filtro) => {
    return Credito.find(filtro).sort({nome : 1});
};

Creditos.consultar = (id) => {
    return Credito.findOne({ _id: id });
};

Creditos.criar = n => {
    n._id = mongoose.Types.ObjectId()
    var newCredito = new Credito(n);

    return newCredito.save(); 
}

Creditos.update = function(id, name, fili, fun, description){
    return Credito
        .update({_id : id}, {$set : {nome : name, filiacao : fili, funcao : fun, desc : description}})
        .exec()
}

Creditos.eliminar = function(id, callback){
    Credito.findOneAndRemove({_id: id}, function(err, noticia){
        if (err) {	
            callback(err, null);
        } else if(!noticia){
            try{
                id = mongoose.Types.ObjectId(id)
                Credito.findOneAndRemove({_id: id}, function(err2, noticia2){
                    if(err2){
                        callback(err2, null);
                    }else{
                        callback(null, noticia2);
                    }
                })
            }catch(e){
                callback("Colaboração não existe", null)
            }
        } else {
		    callback(null, noticia);
        }
    });
}


Creditos.append = async function(dados){ 
    // Converter IDs para o tipo do mongoose
    dados.forEach(elem => {
        elem._id = mongoose.Types.ObjectId(elem._id.$oid);
    })
    try{
        await new Promise((resolve, reject) => {
            // ordered a false permite que caso aconteça erro a inserir o elemento N, os restantes elementos podem ser inseridos
            Credito.insertMany(dados, { ordered : false }, function(err,result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result);
                }
            })
        })
    }catch(err){
        throw(`Erro na importação das colaborações. Apenas foram registadas as colaborações sem erros. Foram inseridas ${err.insertedDocs.length} colaborações de ${dados.length}.`);
    }
    return "Colaborações importadas com sucesso!"
}

Creditos.replace = async function(dados){
    // Converter IDs para o tipo do mongoose
    dados.forEach(elem => {
        elem._id = mongoose.Types.ObjectId(elem._id.$oid);
    })
    // Apaga todos os registos
    try {
        await new Promise((resolve, reject) => {
            Credito.deleteMany({}, function(err) {
                if(err){
                    reject(err)
                }
                else {
                    // ordered a false permite que caso aconteça erro a inserir o elemento N, os restantes elementos podem ser inseridos
                    Credito.insertMany(dados, { ordered : false }, function(err,result) {
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
        throw(`Erro na importação das colaborações. Apenas foram registadas as colaborações sem erros. Foram inseridas ${err.insertedDocs.length} colaborações de ${dados.length}.`);
    }
    return "Colaborações importadas com sucesso!"
}