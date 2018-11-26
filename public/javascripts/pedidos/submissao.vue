var subPedidos = new Vue({
    el: '#submissao-form',
    data: {
        id: "",
        pedido: {},
        
        descPedido: [],
        submissaoReady: false,
    },
    methods: {
        parsePedido: function() {
            let link="/pedidos/" + this.pedido.codigo;
            let date = new Date(this.pedido.distribuicao[0].data);

            var data = date.getDate() + "-" + (parseInt(date.getMonth()) + 1) + "-" + date.getFullYear();

            this.descPedido[0] = this.pedido.codigo;
            this.descPedido[1] = this.pedido.objeto.acao + " " + this.pedido.objeto.tipo;
            this.descPedido[2] = "O seu pedido foi submetido com sucesso"
            this.descPedido[3] = data;
            this.descPedido[4] = `<button><a href='${link}'>Ver Pedido</a></button>`;
            this.submissaoReady = true;
        }

    },
    created: function (){
        this.$http.get("/api/pedidos/")
            .then(function (response){
                this.pedido = response.body[response.body.length-1];
            })
            .then(function () {
                this.parsePedido();
            })
            .catch(function (error) {
                console.error(error);
            })
    }
})