var newOrg = new Vue({
    el: '#nova-entidade-form',
    data: {
        des: "",
        sigla: "",
        message: "",
    },
    components: {
        spinner: VueStrap.spinner
    },
    methods: {
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                des: this.des,
                sigla: this.sigla,
            }

            this.$http.post('/api/tipologias/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {    
                    this.$refs.spinner.hide();
                    
                    if (response.body != "Designação e/ou Sigla já existente(s)!") {
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