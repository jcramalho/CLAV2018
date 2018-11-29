var consPedido = new Vue({
    el: '#pedido-form',
    data: {
        pedido: {},
        dist: [{}],

        pedidoReady: false,
        tipoObj: "",
    },
    methods: {
        parseDistribuicao: function() {

            for(var i = 0; i<this.pedido.distribuicao.length; i++){
                let date = new Date(this.pedido.distribuicao[i].data);

                var data = date.getDate() + "-" + (parseInt(date.getMonth()) + 1) + "-" + date.getFullYear();
                
                this.dist[i].data = data;
                
            }
            this.pedidoReady = true;
        },
        tipoObjeto: function() {
            if(this.pedido.objeto.tipo=="Entidade"){
                this.tipoObj = "entidades";
            }
            if(this.pedido.objeto.tipo=="Tipologia"){
                this.tipoObj = "tipologias";
            }
            if(this.pedido.objeto.tipo=="Legislação"){
                this.tipoObj = "legislacao";
            }
        }

    },
    created: function (){
        this.id = window.location.pathname.split('/')[2];

        this.$http.get("/api/pedidos/" + this.id)
            .then(function (response){
                this.pedido = response.body;
            })
            .then(function (){
                this.tipoObjeto();
                this.parseDistribuicao();
                
            })
            .catch(function (error) {
                console.error(error);
            })
    }
})