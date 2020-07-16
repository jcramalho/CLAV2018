const Notificacao = require('../../models/notificacoes');
const Notifier = require('../../config/Notifier');
const User = require('../../models/user');
const Notificacoes = module.exports;

Notificacoes.getByEnt = async function(ent){

    console.log("Entidade: " + ent);

    try{
        notificacoesEnt = await User.find({ entidade: ent });
        return notificacoesEnt;

    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a obter as notificacoes da entidade! Tente novamente mais tarde'
    }
}

Notificacoes.criar = async function(n){
    try{    
        console.log(n)
        var newNotificacao = new Notificacao(n);
        Notifier.pubUsr(n.responsavel, n)
        Notifier.pubEnt(n.entidade, n)

        newNotificacao = await newNotificacao.save();
        return newNotificacao;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a submeter a notificacao! Tente novamente mais tarde'
    }
}