var classesSide = new Vue({
    el: '#sidebar-tabela-classes',
    data: {
        activeClass: "",
        tableData: [],
        ready: false,
        nEdits: 0,
    },
    methods: {
        rowClicked: function(params){
            window.location.href = '/classes/consultar/c'+params.rowData.codigo;
        },

        loadClasses: function() {
            this.$http.get("/api/classes")
                .then(function (response) {
                    this.tableData = response.body;
                    this.ready = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
    },
    created: function(){
        this.activeClass = window.location.pathname.split('/')[3];
        this.loadClasses();
    }
})