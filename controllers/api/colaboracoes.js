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