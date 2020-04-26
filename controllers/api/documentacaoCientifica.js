const DocCientifica = require('../../models/documentacaoCientifica');
const DocumentacaoCientifica = module.exports;
var mongoose = require('mongoose');

DocumentacaoCientifica.listar = (filtro) => {
    return DocCientifica.find(filtro);
};

DocumentacaoCientifica.listar_classes = () => {
    return DocCientifica.distinct("classe");
};

DocumentacaoCientifica.consultar = (id) => {
    return DocCientifica.findOne({ _id: id });
};

DocumentacaoCientifica.consultar_ficheiro = (id) => {
    return DocCientifica.findOne({ _id: id }, {ficheiro : 1});
};

DocumentacaoCientifica.criar = doc => {
    doc._id = mongoose.Types.ObjectId()
    var newDoc = new DocCientifica(doc);

    return newDoc.save(); 
}


DocumentacaoCientifica.update = function(id, documento){
    return DocCientifica
        .update({_id : id}, documento, {overwrite: true })
        .exec()
}

DocumentacaoCientifica.eliminar = function(id, callback){
    DocCientifica.findOneAndRemove({_id: id}, function(err, documento){
        if (err) {	
            callback(err, null);
        } else if(!documento){
            try{
                id = mongoose.Types.ObjectId(id)
                DocCientifica.findOneAndRemove({_id: id}, function(err2, documento2){
                    if(err2){
                        callback(err2, null);
                    }else{
                        callback(null, documento2);
                    }
                })
            }catch(e){
                callback("Documentação não existe", null)
            }
        } else {
		    callback(null, documento);
        }
    });
}
