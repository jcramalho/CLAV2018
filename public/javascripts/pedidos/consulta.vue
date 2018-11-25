var pedidos = new Vue({
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
            })
            .catch(function (error) {
                console.error(error);
            })
    }
})