var classes = new Vue({
    el: '#tabela-classes',
    data: {
        subReady: true,
        tableHeader: [],
        classesLista: [],
        ready: false,
        content: [],
        cwidth: ['9%','88%'],
        subTemp: [],
        nEdits: 0,
    },
    methods: {
        rowClicked: function(params){
            window.location.href = '/classes/consultar/c'+params.rowData.codigo;
        },

        loadClasses: function() {
            this.ready=false;
            this.$http.get("/api/classes")
                .then(function (response) {
                    this.classesLista = response.body;
                    this.ready = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        
        addClass: function(row){
            window.location.href = '/classes/adicionar';
        },
    },
    created: function(){
        this.tableHeader=[
            "CLASSE",
            "TÍTULO"
        ];

        this.loadClasses();
    }
})