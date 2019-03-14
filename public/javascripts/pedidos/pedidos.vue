var pedidos = new Vue({
    el: '#tabela-pedidos',
    data: {
        tabelaReady: false,
        listaPedidos: [],

        data: "",
    },
    methods: {
        rowClicked: function(pid){
            window.location.href = '/pedidos/'+pid;
        },
        parse: function () {

            for(var i = 0; i<this.listaPedidos.length; i++){
                let lenDistribuicao = this.listaPedidos[i].distribuicao.length;
                let date = new Date(this.listaPedidos[i].distribuicao[0].data);

                this.listaPedidos[i].data = date.getDate() + "-" + (parseInt(date.getMonth()) + 1) + "-" + date.getFullYear();
                this.listaPedidos[i].estado = this.listaPedidos[i].distribuicao[lenDistribuicao-1].estado;
                this.listaPedidos[i].acao = this.listaPedidos[i].objeto.acao 
                this.listaPedidos[i].objeto = this.listaPedidos[i].objeto.tipo;

                //this.id = this.listaPedidos[i].objeto.tipo;
                
            }
        }
    },
    created: function (){
        this.$http.get("/api/pedidos/")
            .then(function (response){
                this.listaPedidos = response.body;
            })
            .then(function (){
                this.parse();
                this.tabelaReady = true;
            })
            .catch(function (error) {
                console.error(error);
            })

    }
})