var leg = new Vue({
    el: '#legislacao-form',
    data: {
        id: "",
        legData : {
            date: {
                label: "Data",
                original: "",
            },
            number: {
                label: "Número",
                original: "",
            },
            type: {
                label: "Tipo",
                original: "",
            },
            title: {
                label: "Sumário",
                original: "",
            },
            link: {
                label: "Link",
                original: "",
            },
            org: {
                label: "",
                original: [],
            }
        },
        content: [],

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
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/legislacao/" + this.id+"/regula")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.processes = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));

                    if(this.processes.length>0)
                        this.processesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseList: function (content, keys) {
            var dest = [];
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1'); // Retira os prefixos RDF
                    }
                }

                dest[i] = JSON.parse(JSON.stringify(temp));
            }

            return dest.sort(function (a, b) {
                return a.id.localeCompare(b.id);
            });
        },   
        parse: function(){    
            this.legData.date.original=this.content[0].Data.value;
            this.legData.number.original=this.content[0].Número.value;
            this.legData.type.original=this.content[0].Tipo.value;
            this.legData.title.original=this.content[0].Titulo.value;
            this.legData.link.original=this.content[0].Link.value;

            let ent = this.content[0].Entidades.value;

            if(ent.length>0){
                this.legData.org.original = ent.split(";").map(
                    function(e){
                        let data = e.split("::");
                        return {
                            id: data[0].replace(/[^#]+#(.*)/, '$1'),
                            sigla: data[1],
                            nome: data[2]
                        }
                    }
                );
                for(l in this.legData.org.original){
                    this.legData.org.label += " " + this.legData.org.original[l].sigla;
                }
            }
        
            this.ready=true;
        },
    },
    created: function(){
        this.id=window.location.pathname.split('/')[3];

        this.$http.get("/api/legislacao/"+this.id)
        .then( function(response) { 
            this.content = response.body;
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