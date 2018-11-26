var consPedido = new Vue({
    el: '#pedido-form',
    data: {
    },
    methods: {

    },
    created: function (){
        this.id = window.location.pathname.split('/')[2];

        this.$http.get("/api/pedidos/" + this.id)
            .then(function (response){
                this.pedido = response.body;
                console.log(this.pedido)
            })
            .catch(function (error) {
                console.error(error);
            })
    }
})