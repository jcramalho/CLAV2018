var pedidos = new Vue({
    el: '#tabela-pedidos',
    data: {
        lista: [],
    },
    methods: {

    },
    created: function (){
        this.$http.get("/api/pedidos/")
            .then(function (response){
                this.lista = response.body;
                console.log(this.lista)
            })
            .catch(function (error) {
                console.error(error);
            })

    }
})