var pedidos = new Vue({
    el: '#tabela-pedidos',
    data: {
        tabelaReady: false,
        listaPedidos: [],
        email:"",
        data: "",
        pid: "",
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
        this.id = window.location.pathname.split('/')[3];
        this.$http.get("/api/users/getEmail/" + this.id)
            .then(function (response){
                this.email = response.body.email;
        }).then(function (){
            this.$http.get("/api/pedidos?criadoPor=" + this.email)
                .then(function (response){
                    this.listaPedidos = response.body;
                })
                .then(function (){
                    this.parse();
                    if(this.listaPedidos.length>0)
                        this.tabelaReady = true;
                    else
                        this.tabelaReady = false;
                })
                .catch(function (error) {
                    console.error(error);
                })
        })
        .catch(function (error) {
            console.error(error);
        })
    }
})