var pedidos = new Vue({
    el: '#tabela-pedidos',
    data: {
        pedidosCarregados: false,
        listaPedidos: [],

        data: "",
    },
    methods: {
        rowClicked: function(pid){
            window.location.href = '/pedidos/'+pid;
        }
    },
    created: function (){
        this.$http.get("/api/pedidos/")
            .then(function (response){
                this.listaPedidos = response.body;
                this.pedidosCarregados = true;
            })
            .catch(function (error) {
                console.error(error);
            })

    }
})