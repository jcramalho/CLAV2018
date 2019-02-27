var termos = new Vue({
    el: '#termos',
    data: {
        tableData: [],
        ready: false
    },
    methods: {
        rowClicked: function(idClasse){
            window.location.href = '/classes/c' + idClasse;
        },
        addTermo: function(row){
            window.location.href = '/termosIndice/adicionar';
        },
    },
    created: function(){
        this.$http.get("/api/termosIndice")
        .then( function(response) { 
            this.tableData = response.body;
            console.log(this.tableData)
            this.ready=true;
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})