var pedidos = new Vue({
    el: '#objeto-pedido',
    data: {
        id: "",
        pedido: "",
        objeto: ""
    },
    created: function (){
        this.id = window.location.pathname.split('/')[2];

        this.$http.get("/api/pedidos/" + this.id)
            .then(function (response){
                this.pedido = response.body;
            })
            .then( function() {
                document.getElementById("json").innerHTML = JSON.stringify(this.pedido.objeto.dados, undefined, 2)
            })
            .catch(function (error) {
                console.error(error);
            })
    }

})