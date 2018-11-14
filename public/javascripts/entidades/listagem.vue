var orgs = new Vue({
    el: '#tabela-entidades',
    data: {
        listaEntidades: [],
        ready: false
    },
    methods: {
        rowClicked: function(row){
            // permite navegar ate a  entidade em questao
            var id = row.id;
            id = id.replace(/[^#]+#(.*)/,'$1');
            
            window.location.href = '/entidades/'+id;
        },
    },
    // Obtem a listagem normalizada a "/api/entidades"
    created: function(){
        this.$http.get("/api/entidades")
        .then( function(response) { 
            this.listaEntidades = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})