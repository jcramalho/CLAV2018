var orgs = new Vue({
    el: '#tabela-tipologias',
    data: {
        listaTipologias: [],
        ready: false,
    },
    methods: {
        rowClicked: function(row){
            // permite navegar ate a tipologia em questao
            var id = row.id;
            
            window.location.href = '/tipologias/'+id;
        },
    },
    created: function(){
        this.$http.get("/api/tipologias")
        .then( function(response) { 
            this.listaTipologias = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})