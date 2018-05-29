var legs = new Vue({
    el: '#tabela-legislacoes',
    data: {
        tableHeader: ["#", "Tipo", "Entidade(s)", "Número", "Titulo", "Data"],
        tableData: [[]],
        ready: false,
        content: [],
        cwidth: ['1%', '12%','10%', '10%', '53%', '15%'],
    },
    methods: {
        rowClicked: function (row) {
            var id = this.content[row[0] - 1].id.value;
            id = id.replace(/[^#]+#(.*)/, '$1');

            window.location.href = '/legislacao/consultar/' + id;
        },
        addLeg: function (row) {
            window.location.href = '/legislacao/adicionar';
        },
        parse: function () {
            // key names for parsing
            var keys = ["Tipo", "Entidades", "Número", "Titulo", "Data"];

            var temp = [];

            // parsing the JSON
            for (var i = 0; i < this.content.length; i++) {
                temp[0] = i + 1;

                for (var j = 0; j < keys.length; j++) {
                    temp[j + 1] = this.content[i][keys[j]].value;
                }

                if(temp[2].length>0){
                    temp[2] = temp[2].split(";").map(
                        function(e){
                            let data = e.split("::");
                            
                            let link = `/organizacoes/consultar/${data[0].replace(/[^#]+#(.*)/, '$1')}`;
                            
                            return `<a href="${link}">${data[1]}</a>`;
                        }
                    ).join(',');

                }
                this.tableData[i] = temp.slice();

            }
        }
    },
    created: function () {
        this.$http.get("/api/legislacao")
            .then(function (response) {
                this.content = response.body;
            })
            .then(function () {
                this.parse();
                this.ready = true;
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})