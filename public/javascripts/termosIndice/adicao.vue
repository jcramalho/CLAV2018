var newTI = new Vue({
    el: '#novo-termo-indice',
    data: {
        termo: "",
        idClasse: "",
        tituloClasse: "",
        id: "",
        message: "",
    },
    components: {
        spinner: VueStrap.spinner,
    },
    idTermoIndice: function(){
        axios.get("/api/utils/id")
            .then(function(response){
                this.id = {id: 'ti_' + response.data, termo: '', existe: false};
                //-termos.push(n);
            })
            .catch(function (error) {
                console.error(error);
            });
    },
    methods: {
        add: function () {
            this.$refs.spinner.show();
            console.log(this.termo);

            var dataObj = {
                termo: this.termo,
                //-idClasse: this.idClasse,
                //-tituloClasse: this.tituloClasse,
                id: this.id,
            }

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
    }
})