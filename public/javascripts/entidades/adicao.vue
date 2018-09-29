var newOrg = new Vue({
    el: '#nova-entidade-form',
    data: {
        name: "",
        initials: "",
        international: "Não",
        message: "",
        tip: "",
        tipologias: [],
        tipologiasSel: []
    },
    created: function(){
        this.$http.get("/api/tipologias")
        .then( function(response) { 
            this.content = response.body;
            var i, t
            for( i=0; i < this.content.length; i++){ 
                t = this.content[i]
                var myID = t.id.value.split('#')
                var myTipol = {sigla: t.Sigla.value, designacao: t.Designacao.value, id: myID[1]}
                this.tipologias.push(myTipol)
            }
            this.tipologias.sort(this.dynamicSort("sigla"))
            this.ready=true
        })
        .catch( function(error) { 
            console.error(error); 
        });
    },
    components: {
        spinner: VueStrap.spinner
    },
    methods: {
        dynamicSort: function(property) {
            var sortOrder = 1;
            if(property[0] === "-") {
                sortOrder = -1;
                property = property.substr(1);
            }
            return function (a,b) {
                var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
                return result * sortOrder;
            }
        },
        findTip: function(tid){
            var i=0, encontrado = false
            while((i < this.tipologias.length)&&(!encontrado)){
                if(tid == this.tipologias[i].id) encontrado = true
                else i++
            }
            return encontrado?i:-1
        },
        addTip: function(){
            var ind = this.findTip(this.tip)
            this.tipologiasSel.push(this.tipologias[ind])
        },
        add: function () {
            this.$refs.spinner.show();

            var dataObj = {
                name: this.name,
                initials: this.initials,
                international: this.international,
                tipologias: this.tipologiasSel
            }

            this.$http.post('/api/entidades/', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {    
                    this.$refs.spinner.hide();
                    
                    if (response.body != "Designação e/ou Sigla já existente(s)!") {
                        window.location.href = '/entidades/consultar/' + response.body;
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