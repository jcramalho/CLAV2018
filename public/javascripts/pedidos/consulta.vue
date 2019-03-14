var consPedido = new Vue({
    el: '#pedido-form',
    data: {
        pedido: {},
        estados: [],

        pedidoReady: false,
        tipoObj: "",
    },
    created: function (){
        this.id = window.location.pathname.split('/')[2];

        this.$http.get("/api/pedidos/" + this.id)
            .then(function (response){
                this.pedido = response.body;
                this.pedidoReady = true;
            })
            .catch(function (error) {
                console.error(error);
            })
    }
})