var gped = new Vue({
    el: '#pedidos-gestao',
    data: {
        pedidos: [],
        pedidosCarregados: false,
        pedidosNovos: [],
        pedidosNovosCarregados: false,
        pedidosEmApreciacao: [],
        pedidosEmApreciacaoCarregados: false,
        pedidosEmValidacao: [],
        pedidosEmValidacaoCarregados: false
    },
    created: function (){

        // Vai bscar todos os pedidos

        this.$http.get("/api/pedidos")
            .then(function (response) {
                this.pedidos = response.body;
                this.pedidosCarregados = true;
            })
            .catch(function (error) {
                console.error(error);
            });

        // Vai buscar os pedidos novos: tipo="Submetido"

        this.$http.get("/api/pedidos?tipo=Submetido")
            .then(function (response) {
                this.pedidosNovos = response.body;
                this.pedidosNovosCarregados = true;
            })
            .catch(function (error) {
                console.error(error);
            });

        // Vai buscar os pedidos novos: tipo="EmApreciacao"

        this.$http.get("/api/pedidos?tipo=EmApreciacao")
            .then(function (response) {
                this.pedidosEmApreciacao = response.body;
                this.pedidosEmApreciacaoCarregados = true;
            })
            .catch(function (error) {
                console.error(error);
            });

        // Vai buscar os pedidos novos: tipo="EmValidacao"

        this.$http.get("/api/pedidos?tipo=EmValidacao")
            .then(function (response) {
                this.pedidosEmValidacao = response.body;
                this.pedidosEmValidacaoCarregados = true;
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