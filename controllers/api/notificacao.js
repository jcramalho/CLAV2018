const Notificacao = require('../../models/notificacao');
const User = require('../../models/user');
const Notificacoes = module.exports;

Notificacoes.consultar = (id) => {
    return Notificacao.findOne({ _id: id });
};

Notificacoes.criar = async function(n){
    var newNotificacao = new Notificacao(n);

    try{
        newNotificacao = await newNotificacao.save();
        await User.update(
            { entidade: newNotificacao.entidade },
            { $push: { notificacoes: newNotificacao._id } }
         );
        return newNotificacao
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a submeter a notificacao! Tente novamente mais tarde'
    }
}

Notificacoes.getByUser = async function(idUser){
    var notificacoes = [];

    queryUser = { _id: idUser };
	ids = await User.findOne(queryUser, {_id: 0, notificacoes: 1});

    try{
        ids.forEach(async function(idNotificacao) {
            var query = { _id: idNotificacao };
            var newNotificacao = await Notificacao.findOne(query)
            notificacoes.push( newNotificacao );
        });
        return notificacoes;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a obter as notificacoes do utilizador! Tente novamente mais tarde'
    }

}