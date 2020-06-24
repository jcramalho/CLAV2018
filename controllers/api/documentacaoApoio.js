const DocApoio = require('../../models/documentacaoApoio');
const DocumentacaoApoio = module.exports;
var mongoose = require('mongoose');
var path = require('path');
var fs = require('fs');

// -------------------------------------- Consultas --------------------------------

DocumentacaoApoio.listar = (filtro) => {
    return DocApoio.find(filtro);
};

DocumentacaoApoio.listar_classes = () => {
    return DocApoio.distinct("classe");
};

DocumentacaoApoio.consultar = (id) => {
    return DocApoio.findOne({ _id: id });
};

DocumentacaoApoio.consultar_entradas = (id) => {
    return DocApoio.findOne({ _id: id}, {entradas : 1});
};

DocumentacaoApoio.consultar_entrada = (id, entrada) => {
    //return DocApoio.findOne({ _id: id, "entradas._id" : entrada });
    let idM = mongoose.Types.ObjectId(id);
    let idE = mongoose.Types.ObjectId(entrada);
    return DocApoio.aggregate([ 
        { $match : 
            {"_id" : idM}
        }, 
        { $unwind : "$entradas"},
        { $match : 
            {"entradas._id" : idE}
        },
        { $project : 
            {
                _id : "$entradas._id",
                descricao : "$entradas.descricao",
                elementos : "$entradas.elementos"
            }
        }
    ]);
};

DocumentacaoApoio.consultar_elementos = (id, entrada) => {
    let idM = mongoose.Types.ObjectId(id);
    let idE = mongoose.Types.ObjectId(entrada);
    return DocApoio.aggregate([ 
        { $match : 
            {"_id" : idM}
        }, 
        { $unwind : "$entradas"},
        { $match : 
            {"entradas._id" : idE}
        },
        { $project : 
            {
                _id : "$entradas._id",
                elementos : "$entradas.elementos"
            }
        }
    ]);
};

DocumentacaoApoio.consultar_elemento = (id, entrada, elemento) => {
    let idM = mongoose.Types.ObjectId(id);
    let idE = mongoose.Types.ObjectId(entrada);
    let idEle = mongoose.Types.ObjectId(elemento);
    return DocApoio.aggregate([ 
        { $match : 
            {"_id" : idM}
        }, 
        { $unwind : "$entradas"},
        { $unwind : "$entradas.elementos"},
        { $match : 
            {"entradas._id" : idE, "entradas.elementos._id" : idEle}
        },
        { $project : 
            {
                _id : "$entradas.elementos._id",
                visivel : "$entradas.elementos.visivel",
                texto : "$entradas.elementos.texto",
                ficheiro : "$entradas.elementos.ficheiro"
            }
        }
    ]);
};

DocumentacaoApoio.consultar_ficheiro = (id, entrada, elemento) => {
    let idM = mongoose.Types.ObjectId(id);
    let idE = mongoose.Types.ObjectId(entrada);
    let idEle = mongoose.Types.ObjectId(elemento);
    return DocApoio.aggregate([ 
        { $match : 
            {"_id" : idM}
        }, 
        { $unwind : "$entradas"},
        { $unwind : "$entradas.elementos"},
        { $match : 
            {"entradas._id" : idE, "entradas.elementos._id" : idEle}
        },
        { $project : 
            {
                nome: "$entradas.elementos.ficheiro.nome",
                path: "$entradas.elementos.ficheiro.path",
                data: "$entradas.elementos.ficheiro.data",
                mimetype: "$entradas.elementos.ficheiro.mimetype",
                size: "$entradas.elementos.ficheiro.size",
            }
        }
    ]);
};

// ---------------------------------- Adições ------------------------------------

DocumentacaoApoio.criar_classe = c => {
    let n = {
        _id : mongoose.Types.ObjectId(),
        classe : c,
        entradas : []
    }
        
    var newDocApoio = new DocApoio(n);
    return newDocApoio.save(); 
}

DocumentacaoApoio.criar_elemento = (classe, entrada, elemento) => {
    elemento._id = mongoose.Types.ObjectId();
    
    return DocApoio.findOneAndUpdate(
        { _id : classe, "entradas._id" : entrada}, 
        { $push : { "entradas.$[elem].elementos" : elemento}},
        { arrayFilters : [{ "elem._id": entrada }]})
        .exec()
    
}

DocumentacaoApoio.criar_entrada = (classe, entrada) => {
    let ent = {
        _id: mongoose.Types.ObjectId(),
        descricao: entrada,
        elementos: []
    };
    
    return DocApoio.findOneAndUpdate(
        { _id : classe}, 
        { $push : { entradas : ent}})
        .exec()
    
}

// ---------------------------------- Atualizações -------------------------------------

DocumentacaoApoio.editar_classe = (id, classe) => {
    return DocApoio
        .update({_id : id}, classe, {overwrite: true })
        .exec();
}

DocumentacaoApoio.editar_entrada = (id, entrada, desc) => {
    return DocApoio.findOneAndUpdate(
        { _id : id, "entradas._id" : entrada}, 
        { $set : { "entradas.$[elem].descricao" : desc}},
        { arrayFilters : [{ "elem._id": entrada }]})
        .exec()    
}

DocumentacaoApoio.editar_elemento = (id, entrada, elemento, objeto) => {
    return DocApoio.findOneAndUpdate(
        { _id : id, "entradas._id" : entrada}, 
        { $set : { "entradas.$[elem].elementos.$[i]" : objeto}},
        { arrayFilters : [{ "elem._id": entrada }, { "i._id": elemento }]})
        .exec()    
}

// ---------------------------------- Eliminações --------------------------------------

DocumentacaoApoio.eliminar_elemento = function(classe, entrada, elemento, callback) {
    return DocApoio.findOneAndUpdate(
        { _id : classe, "entradas._id" : entrada}, 
        { $pull : { "entradas.$[elem].elementos" : { _id : elemento }}},
        { arrayFilters : [{ "elem._id": entrada }]}, function(err, documento){
            if(err){
                callback(err, null);
            } else {
                callback(null, documento);
            }
        })
        .exec()
}

DocumentacaoApoio.eliminar_entrada = function(classe, entrada, callback) {
    return DocApoio.findOneAndUpdate(
        { _id : classe}, 
        { $pull : { entradas : { _id : entrada }}}, function(err, documento){
            if(err){
                callback(err, null);
            } else {
                callback(null, documento);
            }
        })
        .exec()
}

DocumentacaoApoio.eliminar = function(id, callback){
    DocApoio.findOneAndRemove({_id: id}, function(err, documento){
        if (err) {	
            callback(err, null);
        } else if(!documento){
            try{
                id = mongoose.Types.ObjectId(id)
                DocApoio.findOneAndRemove({_id: id}, function(err2, documento2){
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

// -------------------------------------- Importação -----------------------------------

function create_folders(lista){
    try {
        let classes = lista.map(x => x.classe.replace(/ /g, '_'));
        classes.forEach(classe => {
            let dbpath = '/public/documentacao_apoio/' + classe;
            let full_path = path.resolve(__dirname + '/../../' + dbpath);
            if(!fs.existsSync(full_path)){
                fs.mkdirSync(path.resolve(full_path))
            }
        })
    } catch(e){

    }
}

DocumentacaoApoio.append = async function(dados){ 
    // Converter IDs para o tipo do mongoose
    dados.forEach(elem => {
        elem._id = mongoose.Types.ObjectId(elem._id.$oid);
    })
    try{
        await new Promise((resolve, reject) => {
            // ordered a false permite que caso aconteça erro a inserir o elemento N, os restantes elementos podem ser inseridos
            DocApoio.insertMany(dados, { ordered : false }, function(err,result) {
                if (err) {
                    create_folders(err.insertedDocs);
                    reject(err)
                } else {
                    create_folders(result);
                    resolve(result);
                }
            })
        })
    }catch(err){
        throw(`Erro na importação dos documentos. Apenas foram registados os documentos sem erros. Foram inseridos ${err.insertedDocs.length} documentos de ${dados.length}.`);
    }
    return "Documentação importada com sucesso!"
}

DocumentacaoApoio.replace = async function(dados){
    // Converter IDs para o tipo do mongoose
    dados.forEach(elem => {
        elem._id = mongoose.Types.ObjectId(elem._id.$oid);
    })
    // Apaga todos os registos
    try {
        await new Promise((resolve, reject) => {
            DocApoio.deleteMany({}, function(err) {
                if(err){
                    reject(err)
                }
                else {
                    // ordered a false permite que caso aconteça erro a inserir o elemento N, os restantes elementos podem ser inseridos
                    DocApoio.insertMany(dados, { ordered : false }, function(err,result) {
                        if (err) {
                            create_folders(err.insertedDocs);
                            reject(err)
                        } else {
                            create_folders(result);
                            resolve(result);
                        }
                    })
                }
            });
        })
    }catch(err){
        throw(`Erro na importação dos documentos. Apenas foram registados os documentos sem erros. Foram inseridos ${err.insertedDocs.length} documentos de ${dados.length}.`);
    }
    return "Documentação importada com sucesso!"
}