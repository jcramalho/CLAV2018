var gped = new Vue({
    el: '#pedidos-gestao',
    data: {
        pedidosNovos: []
    },
    created: function (){
        this.$http.get("/api/pedidos?tipo=Submetido")
            .then(function (response) {
                this.pedidosNovos = response.body;
            })
            .catch(function (error) {
                console.error(error);
            });
    }
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