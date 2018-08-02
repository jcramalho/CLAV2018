var newOrg = new Vue({
    el: '#nova-entidade-form',
    data: {
        name: "",
        initials: "",
        message: "",
    },
    components: {
        spinner: VueStrap.spinner
    },
    methods: {
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                name: this.name,
                initials: this.initials,
            }

            this.$http.post('/api/tipologias/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {    
                    this.$refs.spinner.hide();
                    
                    if (response.body != "Designação e/ou Sigla já existente(s)!") {
                        window.location.href = '/tipologias/consultar/' + response.body;
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