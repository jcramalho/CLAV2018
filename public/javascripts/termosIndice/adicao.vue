var newTI = new Vue({
    el: '#novo-termo-indice',
    data: {
        termo: "",
        //idClasse: "",
        //tituloClasse: "",
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
        idTermoIndice: function(){
            axios.get("/api/utils/id")
                .then(function(response){
                    //this.id = {id: 'ti_' + response.data, termo: '', existe: false};
                    this.id= 'ti_' + response.data
                    //termos.push(n);
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
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
            var existeClasse = 0;
            console.log(this.newClasse)
            console.log(this.newDominio)
            for(var i=0; i<this.newDominio.length; i++){
                if("c" + this.newClasse.value.codigo== "c" + this.newDominio[i].codigo){
                    existeClasse = 1;
                    break
                }
            }
            if(existeClasse==0){
                this.newDominio.unshift(this.newClasse.value)
            }
            else{
                messageL.showMsg("Essa Classe já se encontra selecionada!");
            }
            console.log(this.newDominio)
        },
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                termo: this.termo,
                //-idClasse: this.idClasse,
                //-tituloClasse: this.tituloClasse,
                id: this.id,
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
        this.idTermoIndice();
        this.loadClasses();   
    }
})