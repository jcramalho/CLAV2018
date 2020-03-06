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
        console.log("ID: " + newNotificacao._id);
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

    console.log("ID: " + idUser);

    ids = await User.findOne({ _id: idUser}, {_id: 0, notificacoes: 1});

    try{
        var notificacoesRes = [];
        for(i = 0; i < ids.notificacoes.length; i++){
            var query = { _id: ids.notificacoes[i] };
            var newNotificacao = await Notificacao.findOne(query);
            notificacoesRes.push( newNotificacao );

        };
        return notificacoesRes;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a obter as notificacoes do utilizador! Tente novamente mais tarde'
    }

}