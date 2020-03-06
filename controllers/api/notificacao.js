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
        await User.updateMany(
            { entidade: newNotificacao.entidade },
            { $push: { notificacoes: newNotificacao._id } }
         );
        return newNotificacao;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a submeter a notificacao! Tente novamente mais tarde'
    }
}

Notificacoes.getByUser = async function(idUser){
    var notificacoes = [];

	ids = await User.findOne({ _id: idUser}, {_id: 0, notificacoes: 1});
    console.log("Notificacoes: " + ids);
    try{
        ids.notificacoes.forEach(async function(idNotificacao) {
            var query = { _id: idNotificacao };
            var newNotificacao = await Notificacao.findOne(query);
            notificacoes.push( newNotificacao );
        });
        return notificacoes;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a obter as notificacoes do utilizador! Tente novamente mais tarde'
    }

}