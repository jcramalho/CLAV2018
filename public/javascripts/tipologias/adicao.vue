var newTip = new Vue({
    el: '#nova-tipologia-form',
    data: {
        tipologia: {
            designacao: "",
            sigla: "",
            entidades: [],
        },
        message: "",
        ent: [],
        entReady: false,
        entTableHeader: ["Sigla", "Nome"],
        entTableWidth: ["15%", "85%"],
        list: [],
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
                                data: [item.sigla, item.designacao],
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
        entSelected: function (row) {
            if (!row.selected) {
                this.list.push(row.id);
            }
            else {
                let index = this.list.indexOf(row.id);
                if (index != -1) {
                    this.list.splice(index, 1);
                }
            }
        },
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                designacao: this.tipologia.designacao,
                sigla: this.tipologia.sigla,
                entidades: this.list,
            }

            this.$http.post('/api/tipologias/', dataObj, {
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
    created: function () {
        this.loadEnts();
    }
})
