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
                    temp = this.listaLegs[i].entidades.split(";").map(
                        function(e){
                            let data = e.split("::");
                            
                            let link = `/entidades/${data[0].replace(/[^#]+#(.*)/, '$1')}`;
                            
                            return `<a href="${link}">${data[1]}</a>`;
                        }
                    ).join(',');

                this.listaLegs[i].entidades = temp.slice();
                }
            }
        },
        rowClicked: function (row) {
            var id = row.id;
            id = id.replace(/[^#]+#(.*)/, '$1');

            window.location.href = '/legislacao/consultar/' + id;
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