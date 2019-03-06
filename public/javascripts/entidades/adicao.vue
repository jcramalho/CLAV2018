var newEnt = new Vue({
    el: '#nova-entidade-form',
    data: {
        tipologias: [],
        ready: false,

        designacao: "",
        sigla: "",
        sioe: "",
        internacional: "Não",
        message: "",
        tip: "",
        
        tipologiasSel: [],
        tipologiasSelecionadas: [],
        tipTableHeader: ["Sigla", "Designação"],
        tipTableWidth: ["15%", "85%"],        
    },
    created: function(){
        //dá a lista de tipologias, para o utilizador adicionar a que tipologias pertence
        this.$http.get("/api/tipologias/")
            .then( function(response) { 
                this.tipologias = response.body
                    .map(function (item) {
                        return {
                            data: [item.sigla, item.designacao],
                            selected: false,
                            id: item.id
                        }
                    }).sort(function (a, b) {
                        return a.data[1].localeCompare(b.data[1]);
                    });
                    this.ready=true
            })
            .catch(function (error) {
                console.error(error);
            }); 
    },
    components: {
        spinner: VueStrap.spinner,
        accordion: VueStrap.accordion,
        modal: VueStrap.modal,
        panel: VueStrap.panel,
    },
    methods: {
        /*dynamicSort: function(property) {
            var sortOrder = 1;
            if(property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a,b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        },*/
        selecionarTipologia: function (row) {
            this.tipologiasSelecionadas.push(row);
            row.selected = true;
        },
        desselecionarTipologia: function (row, index) {
            row.selected = false;
            this.tipologiasSelecionadas.splice(index, 1);
        },
        findTip: function(tid){
            var i=0, encontrado = false
            while((i < this.tipologias.length)&&(!encontrado)){
                if(tid == this.tipologias[i].id) encontrado = true
                else i++
            }
            return encontrado?i:-1
        },
        add: function () {
            var numeroSIOE = new RegExp(/[0-9]+(\-\w)?/);

            if(!numeroSIOE.test(this.sioe) && this.sioe!=""){
                messageL.showMsg("Campo SIOE está no formato errado. Apenas são aceites caracteres numéricos.");
                return false;
            }

            this.$refs.spinner.show();

            for(var i = 0; i< this.tipologiasSelecionadas.length; i++){
                this.tipologiasSel[i] = this.tipologiasSelecionadas[i].id
            }

            var dataObj = {
                designacao: this.designacao,
                sigla: this.sigla,
                sioe: this.sioe,
                internacional: this.internacional,
                tipologias: this.tipologiasSel
            }

            console.log(dataObj);

            this.$http.post('/api/entidades/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function () {
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