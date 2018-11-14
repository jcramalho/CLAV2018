var newLeg = new Vue({
    el: '#nova-legislacao-form',
    data: {
        diploma : {
            Titulo: "",
            Tipo: "",
            Numero: "",
            Data: "",
            Link: "",
            Orgs: [],
        },
        orgs: [],
        orgsReady: false,
        orgsTableHeader: ["#", "Sigla", "Nome", "Tipo"],
        orgsTableWidth: ["4%", "15%", "70%", "15%"],
        message: "",
    },
    components: {
        spinner: VueStrap.spinner,
        datepicker: VueStrap.datepicker,
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
        modal: VueStrap.modal,
    },
    methods: {
        dataEscolhida: function(payload){
            this.diploma.Data=""+payload;
        },
        readyToCreate: function(){
            for(let field in this.diploma){
                if(this.diploma[field].length==0) return false;   
            }

            return true;
        },
        add: function(){
            this.message="";

            var formats= {
                Numero: new RegExp(/[0-9]+(\-\w)?\/[0-9]+/),
                Data: new RegExp(/[0-9]+\/[0-9]+\/[0-9]+/)
            }

            for(let field in formats){
                if(!formats[field].test(this.diploma[field])){
                    this.message+= "<p>Campo '"+field+"' está no formato errado</p>";
                    return false;
                }
            }

            let link = new RegExp(/https?:\/\/.+/);

            if(!link.test(this.diploma.Link)){
                this.diploma.Link = "http://"+this.diploma.Link;
            }

            this.$refs.spinner.show();
            var dataObj = JSON.parse(JSON.stringify(this.diploma));            

            this.$http.post('/api/legislacao/',dataObj,{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then( function(response) { 
                regex = new RegExp(/leg_[0-9]+/, "gi");

                if(regex.test(response.body)){
                    window.location.href = '/legislacao/'+response.body;
                    this.message = "Diploma adicionado! Vai ser redirecionado para a página de consulta/edição..."
                }
                else {
                    messageL.showMsg(response.body);
                }
                this.$refs.spinner.hide();
            })
            .catch( function(error) { 
                console.error(error); 
            });
        },
        loadOrgs: function () {
            var keys = ["id", "Sigla", "Designacao"];
            var i = 0;

            this.$http.get("/api/entidades")
                .then(function (response) {
                    this.orgs = this.parse(response.body, keys)
                        .map(function (item) {
                            return {
                                data: [i++, item.Sigla, item.Designacao, "Entidade"],
                                selected: false,
                                id: item.id
                            }
                        }).sort(function (a, b) {
                            return a.data[1].localeCompare(b.data[1]);
                        });

                    this.orgsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });       
        },
        parse: function (content, keys) {
            var dest = [];
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }

                dest[i] = JSON.parse(JSON.stringify(temp));
            }

            return dest;
        },
        orgSelected: function (row, list, partType) {
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
    },
    created: function () {
        this.loadOrgs();
    }
})