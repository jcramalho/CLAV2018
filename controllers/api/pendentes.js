const Pendente = require('../../models/pendente');
const Pendentes = module.exports;
var Logging = require('../logging');

/**
 * Lista as informações de todas os trabalhos pendentes no sistema, de acordo
 * com o filtro especificado.
 * 
 * @param {Object} filtro objeto com os campos para filtrar. Se o valor de um
 * campo for `undefined` esse campo é ignorado.
 * @param {string} filtro.criadoPor
 * @param {string} filtro.tipo
 * @param {string} filtro.acao
 * @return {Promise<[Pedido] | Error>} promessa que quando cumprida possui a
 * lista dos pedidos que satisfazem as condições do filtro
 */
Pendentes.listar = (filtro) => {
    // Remover campos vazios do filtro
    Object.keys(filtro).forEach((key) => (filtro[key] === undefined) && delete filtro[key]);
    return Pendente.find(filtro);
};

Pendentes.listarTodos = () => {
    return Pendente.find().sort({data: -1});
};

// Recupera a lista de trabalhos pendentes de determinado tipo

Pendentes.getByTipo = function(tipo){
    return Pendente
        .find({tipo: tipo})
        .sort({data: -1})
        .exec()
}

/**
 * Consulta a informação relativa a um trabalho pendente.
 * 
 * @param id identificador do pendente proveniente do campo _id do mongo
 * @return {Promise<Pedido | Error>} promessa que quando cumprida possui o
 * pendente com o código especificado, ou `undefined` se o pendente não existe.
 */
Pendentes.consultar = (id) => {
    return Pendente.findOne({ _id: id });
};

/**
 * Cria um novo pendente no sistema.
 * 
 * @param pendente novo a inserir no sistema.
 * @return {Pendente} pendente criado.
 */
Pendentes.criar = async function(pendente){
    var newPendente = new Pendente(pendente);

    try{
        return await newPendente.save()
    }catch(err){
        console.log(err)
        return 'Ocorreu um erro a submeter o pedido! Tente novamente mais tarde'
    }
}


/**
 * Atualiza um pendente no sistema.
 * 
 * @param pendente a atualizar no sistema.
 * @return {Pendente} pendente atualizado.
 */
Pendentes.atualizar = async function(pendente){
    try{
        var oldPendente = await Pendente.findOne({_id: pendente._id})
        oldPendente.objeto = pendente.objeto
        oldPendente.numInterv = pendente.numInterv
        oldPendente.dataAtualizacao = pendente.dataAtualizacao

        try{
            return await oldPendente.save()
        }catch(err){
            console.log(err)
            return err
        }
    }
    catch(err){
        return err
    }
}

/**
 * Apaga um pendente no sistema.
 * 
 * @param pendente a apagar no sistema.
 * @return {Pendente} pendente atualizado.
 */
Pendentes.apagar = async function(pendente){
    try {
        Pendente.findByIdAndRemove({ _id: pendente}, function(err, updatedPendente){
            if (err) {
                return err;
            } else {
                return (updatedPendente)
            }
        })
    } catch (err) {
        return err
    }
}
