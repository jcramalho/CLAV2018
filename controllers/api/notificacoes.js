var Notificacao = require('../../models/notificacoes.js')

const Notificacoes = module.exports;

Notificacoes.get = (req, res, next ) => {
    Notificacao.getByEnt(req.user.entidade)
        .then(dados => res.jsonp(dados))
        .catch(erro => res.status(500).send(`Erro na obtenção das notificações do utilizador ${req.user.id}: ${erro}`))
}

Notificacoes.post = (req, res, next ) => {
     Notificacao.criar(req.notificacao)        
        .then(dados => console.log(dados))
        .catch(erro => res.status(500).send(`Erro na obtenção das notificações do utilizador ${req.user.id}: ${erro}`));
}
Notificacoes.delete = (req, res, next ) => {
    Notificacao.apagar(req.params.idNotificacao)        
       .then(() => res.send("Notificação removida"))
       .catch(erro => res.status(500).send(`Erro na obtenção das notificações do utilizador ${req.user.id}: ${erro}`));
}