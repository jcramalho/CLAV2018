var legs = new Vue({
    el: '#tabela-legislacoes',
    data: {
        listaLegs: [],
        ready: false,
        opcao: "",
    },
    watch: {
        opcao: function () {
            this.loadLista(this.opcao);
        },
    },
    methods: {
        parseEntidades: function () {
            var temp = [];

            // Vai ao campo "entidades" e gera o link de consulta e o html respetivo
            for (var i = 0; i < this.listaLegs.length; i++) {
                
                if(this.listaLegs[i].entidades.length>0){
                    temp = this.listaLegs[i].entidades.map(
                        function(e){
                            let link = `/entidades/${e.id}`;
                            
                            return `<a href="${link}">${e.sigla}</a>`;
                        }
                    ).join(',');

                this.listaLegs[i].entidades = temp.slice();
                }
                else this.listaLegs[i].entidades = "";
            }
        },
        rowClicked: function (lid) {
            window.location.href = '/legislacao/' + lid;
        },
        addLeg: function (row) {
            window.location.href = '/legislacao/adicionar';
        },
        loadLista: function(opcao){
            this.$http.get("/api/legislacao" + opcao)
                    .then(function (response) {
                        this.listaLegs = response.body;
                    })
                    .then(function () {
                        this.parseEntidades(this.listaLegs);
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
                if( this.opcao === "?processos=sem" ) {
                    this.loadLista(this.opcao);
                }
                else this.opcao= "?processos=sem";
                }
            else if( PNs === "Com PNs Associados" ) {
                this.ready = false;
                if( this.opcao === "?processos=com" ){
                    this.loadLista(this.opcao);
                }
                else this.opcao= "?processos=com";
                }
            else if( PNs === "Todos" ) {
                this.ready = false;
                if( this.opcao === "" ) {
                    this.loadLista(this.opcao);
                }
                this.opcao= "";
                }
            else {
                this.opcao = "";
            }
        }
    },
    created: function () {
        this.$http.get("/api/legislacao")
            .then(function (response) {
                this.listaLegs = response.body;
            })
            .then(function () {
                this.parseEntidades(this.listaLegs);
                this.ready = true;
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})