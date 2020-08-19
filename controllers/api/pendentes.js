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
    return Pendente.find();
};

// Recupera a lista de trabalhos pendentes de determinado tipo

Pendentes.getByTipo = function (tipo) {
    return Pendente
        .find({ tipo: tipo })
        .sort({ data: -1 })
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
Pendentes.criar = async function (pendente) {
    var newPendente = new Pendente(pendente);

    try {
        let pendente_confirmado = await newPendente.save()
        return {
            _id: pendente_confirmado._id,
            numInterv: pendente_confirmado.numInterv,
            acao: pendente_confirmado.acao,
            tipo: pendente_confirmado.tipo,
            criadoPor: pendente_confirmado.criadoPor,
            dataCriacao: pendente_confirmado.dataCriacao,
            dataAtualizacao: pendente_confirmado.dataAtualizacao
        }
    } catch (err) {
        console.log(err)
        throw 'Ocorreu um erro a submeter o pedido! Tente novamente mais tarde'
    }
}


/**
 * Atualiza um pendente no sistema.
 * 
 * @param pendente a atualizar no sistema.
 * @return {Pendente} pendente atualizado.
 */
Pendentes.atualizar = async function (pendente, emailUser) {
    try {
        var oldPendente = await Pendente.findOne({ _id: pendente._id })

        if(oldPendente){
            if(emailUser && oldPendente.criadoPor != emailUser){
                return "sem_permissoes"
            }

            oldPendente.objeto = pendente.objeto

            if (pendente.numInterv != undefined) {
                oldPendente.numInterv = pendente.numInterv
            } else {
                oldPendente.numInterv = oldPendente.numInterv + 1
            }

            oldPendente.dataAtualizacao = Date.now()

            try {
                let novoPendente = await oldPendente.save()
                return {
                    _id: novoPendente._id,
                    numInterv: novoPendente.numInterv,
                    acao: novoPendente.acao,
                    tipo: novoPendente.tipo,
                    criadoPor: novoPendente.criadoPor,
                    dataCriacao: novoPendente.dataCriacao,
                    dataAtualizacao: novoPendente.dataAtualizacao
                }
                //return "Pendente atualizado com sucesso"
            } catch (err) {
                console.log(err)
                throw err
            }
        }else{
            return null
        }
    }
    catch (err) {
        throw err
    }
}

/**
 * Apaga um pendente no sistema.
 * 
 * @param pendente a apagar no sistema.
 */
Pendentes.apagar = async function (pendente, emailUser) {
    return new Promise((resolve, reject) => {
        let filtro = { _id: pendente }
        if(emailUser) {
            filtro["criadoPor"] = emailUser
        }

        Pendente.findOneAndDelete(filtro, function (err, delPendente) {
            if (err) {
                reject(err);
            } else if(delPendente) {
                resolve({
                    _id: delPendente._id,
                    numInterv: delPendente.numInterv,
                    acao: delPendente.acao,
                    tipo: delPendente.tipo,
                    criadoPor: delPendente.criadoPor,
                    dataCriacao: delPendente.dataCriacao,
                    dataAtualizacao: delPendente.dataAtualizacao
                })
                //resolve("Pendente removido")
            } else {
                reject(`O pendente não existe ou não tem permissões para o apagar`)
            }
        })
    })
}

/**
 * Apaga todos os pendentes no sistema.
 *
 */
Pendentes.apagarTodos = async function () {
    await Pendente.deleteMany({}).exec()
    return "Todos os trabalhos pendentes removidos com sucesso"
}
