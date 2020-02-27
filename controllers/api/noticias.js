const Noticia = require('../../models/noticia');
const Noticias = module.exports;

Noticias.listar = (filtro) => {
    return Pedido.find(filtro);
};

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

/**
 * Cria um novo pedido no sistema.
 * 
 * @param pedido novo pedido a inserir no sistema.
 * @return {Pedido} pedido criado.
 */
Noticias.criar = async function(n){
    var newNoticia = new Noticia(n);

    try{
        newNoticia = await newNoticia.save()
        return newNoticia._id
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a submeter a notícia! Tente novamente mais tarde'
    }
}
