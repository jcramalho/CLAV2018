var legs = new Vue({
    el: '#tabela-legislacoes',
    data: {
        listaLegs: [],
        ready: false,
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
        rowClicked: function (row) {
            var id = row.id;

            window.location.href = '/legislacao/' + id;
        },
        addLeg: function (row) {
            window.location.href = '/legislacao/adicionar';
        },
    },
    created: function () {
        this.$http.get("/api/legislacao")
            .then(function (response) {
                this.listaLegs = response.body;
            })
            .then(function () {
                this.parseEntidades();
                this.ready = true;
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})