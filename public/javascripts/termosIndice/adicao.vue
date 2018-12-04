var newTI = new Vue({
    el: '#novo-termo-indice',
    data: {
        termo: "",
        idClasse: "",
        tituloClasse: "",
        id: "",
    },
    components: {
        spinner: VueStrap.spinner
    },
    methods: {
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                termo: this.termo,
                idClasse: this.idClasse,
                tituloClasse: this.tituloClasse,
                id: this.id,
            }

            this.$http.post('/api/termosIndice/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {    
                    this.$refs.spinner.hide();
                    
                    if (response.body != "Termo já existente(s)!") {
                        window.location.href = '/pedidos/submissao';
                    }
                    else {
                        messageL.showMsg(response.body);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        }
    }
})