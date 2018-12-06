var newOrg = new Vue({
    el: '#nova-entidade-form',
    data: {
        tipologia: {
            des: "",
            sigla: "",
        },
        message: "",
        entidades: [],
        ent: [],
        entReady: false,
        entTableHeader: ["#", "Sigla", "Nome", "Tipo"],
        entTableWidth: ["4%", "15%", "70%", "15%"],
    },
    components: {
        spinner: VueStrap.spinner,
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        modal: VueStrap.modal,
    },
    methods: {
        loadEnts: function () {
            var i = 0;

            this.$http.get("/api/entidades")
                .then(function (response) {
                    this.ent = response.body
                        .map(function (item) {
                            return {
                                data: [i++, item.sigla, item.designacao, "Entidade"],
                                selected: false,
                                id: item.id
                            }
                        }).sort(function (a, b) {
                            return a.data[1].localeCompare(b.data[1]);
                        });

                    this.entReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });       
        },
        entSelected: function (row, list, partType) {
            if (!row.selected) {
                list.push(row.id);
            }
            else {
                let index = list.indexOf(row.id);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
        },
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                des: this.tipologia.des,
                sigla: this.tipologia.sigla,
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
    },
    created: function () {
        this.loadEnts();
    }
})