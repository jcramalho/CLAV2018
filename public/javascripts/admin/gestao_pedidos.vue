var parsePedidos = function(content){
    let ret;
    ret=content.map(function(a){
        let link="#";
        if(a.tipo=="Novo PN" && a.objetoID){
            link=`/classes/${a.objetoID}`;
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
        cabecalho:["Nº", "Tipo", "Entidade", "Submissão", "Prazo resposta", ""],
        linhas:[[]],
        pedidosReady: false,
        listaPedidos: [],
    },
    methods: {
        parse: function () {
            for( var i = 0; i<this.listaPedidos.length; i++){
                if(this.listaPedidos[i].distribuicao[0].estado == "Submetido"){
                    let pedido = [];

                    let date = new Date(this.listaPedidos[i].distribuicao[0].data);
                    let data = date.getDate() + "-" + (parseInt(date.getMonth()) + 1) + "-" + date.getFullYear();

                    pedido[0] = this.listaPedidos[i].codigo;
                    pedido[1] = this.listaPedidos[i].objeto.acao + " " + this.listaPedidos[i].objeto.tipo;
                    pedido[2] = this.listaPedidos[i].criadoPor;
                    pedido[3] = data;
                    pedido[4] = "20 dias"
                    pedido[5] = "<button><a href='/pedidos/" + this.listaPedidos[i].codigo + "'>Ver Pedido</a></button>"
                    this.linhas.push(pedido)
                }
            }
        }
    },
    created: function(){
        var content = [];

        this.$http.get("/api/pedidos/")
            .then( function(response) { 
                this.listaPedidos = response.body;
            })
            .then( function() {
                this.parse();
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

var nova_chave = new Vue({
    el: '#nova_chave',
    data: {
        linhas:[
            ["De modo a proceder ao registo de uma nova chave API na plataforma CLAV, por favor clique no seguinte botão.   ",'<form method="get" action="/gestao/nova_chave"><button type="submit">Registo chave API</button></form>'],
        ]
    },
})

var listagem_chaves = new Vue({
    el: '#listagem_chaves',
    data: {
        linhas:[
            ["De modo a proceder à listagem de chaves API existentes na plataforma CLAV, por favor clique no seguinte botão.   ",'<form method="get" action="/gestao/listagem_chaves"><button type="submit">Listagem chaves API</button></form>'],
        ]
    },
})