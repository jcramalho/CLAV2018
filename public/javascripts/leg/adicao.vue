var newLeg = new Vue({
    el: '#nova-legislacao-form',
    data: {
        diploma : {
            sumario: "",
            tipo: "",
            numero: "",
            data: "",
            link: "",
            entidades: [],
        },
        orgs: [],
        orgsReady: false,
        orgsTableHeader: ["Sigla", "Nome"],
        orgsTableWidth: ["15%", "85%"],
        message: "",
        
        //Apenas para teste:
        tipoDiploma: ["DL", "Portaria", "Lei"]
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
            this.diploma.data=""+payload;
        },
        readyToCreate: function(){
            for(let field in this.diploma){
                if(this.diploma[field].length==0  && field!="entidades"  && field!="link") return false;   
            }
            return true;
        },
        add: function(){
            this.message="";

            var formats= {
                numero: new RegExp(/[0-9]\d{5}\/[0-9]\d{3}$/),
                data: new RegExp(/[0-9]+\/[0-9]+\/[0-9]+/)
            }

            for(let field in formats){
                if(!formats[field].test(this.diploma[field])){
                    messageL.showMsg("O campo " + field + " está no formato errado!");
                    return false;
                }
            }

            let Link = new RegExp(/https?:\/\/.+/);

            if(!Link.test(this.diploma.link) && this.diploma.link!=""){
                this.diploma.link = "http://"+this.diploma.link;
            }

            this.$refs.spinner.show();
            var dataObj = JSON.parse(JSON.stringify(this.diploma));  

            this.$http.post('/api/legislacao/', dataObj,{
                headers: {
                    'content-type' : 'application/json'
                }
            })
                .then( function(response) { 
                    this.$refs.spinner.hide();

                    window.location.href = '/pedidos/submissao';
                       
                })
                .catch( error => {if (error.status === 409 ){
                    messageL.showMsg(error.body);
                    this.$refs.spinner.hide();
                }  
                    console.error(error); 
                });
        },
        loadOrgs: function () {
            var i = 0;

            this.$http.get("/api/entidades")
                .then(function (response) {
                    this.orgs = response.body
                        .map(function (item) {
                            return {
                                data: [item.sigla, item.designacao],
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