var orgs = new Vue({
    el: '#tabela-entidades',
    data: {
        listaEntidades: [],
        ready: false,
        opcao: "",
    },
    watch: {
        opcao: function () {
            this.loadLista(this.opcao);
        }
    },
    methods: {
        rowClicked: function(eid){
            // permite navegar ate a  entidade em questao
            window.location.href = '/entidades/'+eid;
        },
        loadLista: function(opcao){
            this.$http.get("/api/entidades" + opcao)
                    .then(function (response) {
                        this.listaEntidades = response.body;
                    })
                    .then(function () {
                        this.ready = true;
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
        },
        filter: function(PNs){
            //filtrar com e sem PNs associados
            if( PNs === "Sem PNs Associados" ) {
                this.ready = false;
                this.opcao= "?processos=sem";
                }
            else if( PNs === "Com PNs Associados" ) {
                this.ready = false;
                this.opcao= "?processos=com";
                }
            else if( PNs === "Todos" ) {
                this.ready = false;
                this.opcao= "";
                
                }
        }
    },
 
    created: function(){
        this.$http.get("/api/entidades")
                    .then(function (response) {
                        this.listaEntidades = response.body;
                    })
                    .then(function () {
                        this.ready = true;
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
    }
})