var orgs = new Vue({
    el: '#tabela-users',
    data: {
        listaUsers: [],
        ready: false
    },
    methods: {
        rowClicked: function(uid){
            // permite navegar ate ao user em questao
            window.location.href = '/users/'+uid;
        },
    },
    // Obtem a listagem normalizada a "/api/users/normalizado"
    created: function(){
        this.$http.get("/api/users/normalizado")
        .then( function(response) { 
            this.listaUsers = response.body;
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})