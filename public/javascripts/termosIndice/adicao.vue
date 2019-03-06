var newTI = new Vue({
    el: '#novo-termo-indice',
    data: {
        termo: "",
        idClasse: "",
        tituloClasse: "",
        id: "",
        

        addClasse: false,
        newClasse: "",
        listaClasses: [],
        newDominio: [],
    },
    components: {
        spinner: VueStrap.spinner,
    },
    methods: {
        loadClasses: function () {
            var classes = [];

            this.$http.get("/api/classes?nivel=3")
                .then(function (response) {
                    classes = response.body;
                })
                .then(function () {
                    this.listaClasses = classes
                        .map(function (item) {
                        return {
                            label: item.codigo + " - " + item.titulo,
                            value: item,
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        addclasse: function(){
            if(this.addClasse===false){
                this.idClasse = this.newClasse.value.codigo
                this.tituloClasse = this.newClasse.value.titulo
                this.addClasse=true;
            }
            else {
                messageL.showMsg("Apenas pode selecionar uma classe!");
            }
        },
        deleteClasse: function(){
            this.idClasse = "";
            this.tituloClasse = "";
            this.addClasse = false;
        },
        add: function () {
            this.$refs.spinner.show();                

            var dataObj = {
                termo: this.termo,
                idClasse: this.idClasse,
                tituloClasse: this.tituloClasse,
                //id: this.id,
            }

            console.log(dataObj)

            this.$http.post('/api/termosIndice/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
            .then(function (response) {    
                this.$refs.spinner.hide();

                window.location.href = '/pedidos/submissao';
            })
            .catch(error => {if (error.status === 409) {
                messageL.showMsg(error.body);
                this.$refs.spinner.hide();
            } 
            console.error(error);
                });
        }
    },
    created: function() {
        /*axios.get("/api/utils/id")
            .then((response) => {
                this.id = 'ti_' + response.data;
            })
            .catch(function (error) {
                console.error(error);
            });*/
        this.loadClasses();   
    }
})