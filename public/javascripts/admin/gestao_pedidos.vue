var parsePedidos = function(content){
    let ret;
    ret=content.map(function(a){
        let link="#";
        if(a.tipo=="Novo PN" && a.objetoID){
            link=`/classes/consultar/${a.objetoID}`;
        }
        else if(a.tipo=="Criação de TS" && a.objetoID){
            link=`/tabelasSelecao/consultar/${a.objetoID}`;
        }

        return [
            a.numero,
            a.tipo,
            a.descricao,
            a.entidade.nome,
            a.data,
            a.prazo,
            `<div class='button-darker'><a href='${link}'>Ver Pedido</a></div>`
        ]
    });
    return ret;
}

var novos = new Vue({
    el: '#novos',
    data: {
        cabecalho:["Nº", "Tipo", "Descrição", "Entidade", "Submissão", "Prazo resposta", ""],
        linhas:[
            ["1","Tipo","DGLAB","1/1/2000","1/1/3000","<button>Ver Pedido</button>"],
        ]
    },
    created: function(){
        var content = [];

        this.$http.get("/api/pedidos/estado/Novo")
        .then( function(response) { 
            content = response.body;
        })
        .then( function() {
            console.log(content);
            this.linhas=parsePedidos(content);
            this.pedidosReady=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})

var apreciacao = new Vue({
    el: '#apreciacao',
    data: {
        cabecalho:["Nº", "Tipo", "Entidade", "Submissão", "Prazo resposta", ""],
        linhas:[
            ["1","Tipo","DGLAB","1/1/2000","1/1/3000","<button>Ver Pedido</button>"],
        ]
    },
})

var validacao = new Vue({
    el: '#validacao',
    data: {
        cabecalho:["Nº", "Tipo", "Entidade", "Submissão", "Prazo resposta", ""],
        linhas:[
            ["1","Tipo","DGLAB","1/1/2000","1/1/3000","<button>Ver Pedido</button>"],
        ]
    },
})

var autorizados = new Vue({
    el: '#autorizados',
    data: {
        cabecalho:["Nº", "Tipo", "Entidade", "Submissão", "Prazo resposta", ""],
        linhas:[
            ["1","Tipo","DGLAB","1/1/2000","1/1/3000","<button>Ver Pedido</button>"],
        ]
    },
})

var novouser = new Vue({
    el: '#novouser',
    data: {
        linhas:[
            ["De modo a proceder ao registo de um novo utilizador na plataforma CLAV, por favor clique no seguinte botão.   ",'<form method="get" action="/users/registar"><button type="submit">Registo</button></form>'],
        ]
    },
})

var editaruser = new Vue({
    el: '#editaruser',
    data: {
        linhas:[
            ["De modo a proceder à edição de um utilizador já existente na plataforma CLAV, por favor clique no seguinte botão.   ",'<form method="get" action="/users/listagem"><button type="submit">Listagem de utilizadores</button></form>'],
        ]
    },
})