var leg = new Vue({
    el: '#legislacao-form',
    data: {
        id: "",

        myLegislacao: {},

        entidades: "",
        ready: false,

        processes: [],
        
        processesCollapsed: true,
        processesReady: false,
    },
    components: {
        datepicker: VueStrap.datepicker,
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
    },
    methods: {
        loadProcesses: function () {  
            this.$http.get("/api/legislacao/" + this.id+"/regula")
                .then(function (response) {
                    this.processes = response.body;

                    if(this.processes.length>0)
                        this.processesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parse: function(){
            //Se tiver entidades associadas colocas todas numa string separadas por espaço    
            let ent = this.myLegislacao.entidades;

            if(ent.length>0){
                for(var i=0; i< ent.length; i++){
                    this.entidades = this.entidades + " " + ent[i].entSigla;
                }
            }      
            this.ready=true;
        }
    },
    created: function(){
        this.id=window.location.pathname.split('/')[2];

        this.$http.get("/api/legislacao/"+this.id)
        .then( function(response) { 
            this.myLegislacao = response.body;
        })
        .then( function() {
            this.parse();
            this.loadProcesses();
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})