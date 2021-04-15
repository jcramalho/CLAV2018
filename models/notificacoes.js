const mongoose = require('mongoose');

const NotificacaoSchema = new mongoose.Schema({
    entidade: {
        type: String,
        required: true
    },
    objeto: {
        type: String,           
        required: false
    },
    acao: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        required: true
    },
    novoEstado: {
        type: String,
        required: true
    },
    criadoPor: {
        type: String,
        required: true
    },
    responsavel: { // Email do técnico responsável pelo pedido no novo estado
        type: String,
        required: false
    },
    pedido: {
        type: String,
        required: false
    }
})


const Notificacao = mongoose.model('Notificacao', NotificacaoSchema, 'notificacoes');
 
Notificacao.getByEnt = async function(ent){

    try{
        notificacoesEnt = await Notificacao.find({ entidade: ent });
        return notificacoesEnt;

    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a obter as notificacoes da entidade! Tente novamente mais tarde'
    }
}

Notificacao.criar = async function(n){
    try{    
        var newNotificacao = new Notificacao(n);
        
        newNotificacao = await newNotificacao.save();

        return newNotificacao;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a submeter a notificacao! Tente novamente mais tarde'
    }
}
Notificacao.apagar = async function(id){
    try{    
        newNotificacao = await Notificacao.findOneAndRemove({_id: id});
        return newNotificacao;
    }catch(err) {
        console.log(err)
        return 'Ocorreu um erro a apagar a notificacao! Tente novamente mais tarde'
    }
}

module.exports = Notificacao;