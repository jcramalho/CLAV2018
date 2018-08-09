var leg = new Vue({
    el: '#legislacao-form',
    data: {
        id: "",
        legData : {
            date: {
                label: "Data",
                original: "",
                new: "",
                edit: false
            },
            number: {
                label: "Número",
                original: "",
                new: "",
                edit: false
            },
            type: {
                label: "Tipo",
                original: "",
                new: "",
                edit: false
            },
            title: {
                label: "Título",
                original: "",
                new: "",
                edit: false
            },
            link: {
                label: "Link",
                original: "",
                new: "",
                edit: false
            },
            org: {
                original: [],
                new: [],
                edit: false
            }
        },
        content: [],
        message: "",
        updateReady: false,
        delConfirm: false,
        ready: false,

        orgs: [],
        orgsReady: false,
        orgsTableHeader: ["#", "Sigla", "Nome", "Tipo"],
        orgsTableWidth: ["4%", "15%", "70%", "15%"],

        classList:[],
        processes: [],
        newProcess: "",
        newProcesses: [],
        editProcesses: false,
        processesCollapsed: true,
        processesReady: false,
    },
    components: {
        datepicker: VueStrap.datepicker,
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
    },
    methods: {
        dateChosen: function(payload){
            this.legData.date.new=""+payload;
        },
        loadClasses: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/classes/nivel=3")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.classList = this.parseList(classesToParse, keys).map(function(item){
                        return {
                            label: item.Code+" - "+item.Title,
                            value: item,
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });
                    
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadProcesses: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/legislacao/" + this.id+"/regula")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.processes = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));
                    this.newProcesses = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));

                    this.processesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadOrgs: function () {
            var dataToParse = [];
            var keys = ["id", "Sigla", "Designacao"];
            var i = 0;

            var selectedOrgs = this.legData.org.original.map(a=>a.id);
            this.legData.org.new = JSON.parse(JSON.stringify(selectedOrgs));

            this.$http.get("/api/entidades")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    this.orgs = this.parseList(dataToParse, keys)
                       .map(function (item) {
                            return {
                                data: [i++, item.Sigla, item.Designacao, "Entidade"],
                                selected: (selectedOrgs.indexOf(item.id)!=-1),
                                id: item.id
                            }
                        }).sort(function (a, b) {
                            return a.data[1].localeCompare(b.data[1]);
                        });

                    this.orgsReady = true;
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
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
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
            }
        
            this.ready=true;
        },
        orgSelected: function (row, list, partType) {
            if (!row.selected) {
                list.push(row.id);
            }
            else {
                let index = list.indexOf(row.id);
                if (index != -1) {
                    list.splice(index, 1);
                }
            }
        },
        update: function(){
            this.$refs.spinner.show();

            var dataObj = {
                id: this.id,
                date: null,
                number: null,
                type: null,
                title: null,
                link: null,
                org: null,
            };

            keys=Object.keys(this.legData);

            for(var i=0;i<keys.length;i++){
                if(this.legData[keys[i]].edit && this.legData[keys[i]].new){
                    dataObj[keys[i]]=this.legData[keys[i]].new;
                }
            }

            console.log(dataObj);

            this.$http.put('/api/legislacao/'+this.id,dataObj,{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then( function(response) { 
                messageL.showMsg(response.body);
                if(this.message=="Actualizado!"){
                    window.location.href = '/legislacao/consultar/'+this.id;
                }
                this.$refs.spinner.hide();
            })
            .catch( function(error) { 
                console.error(error); 
            });
        },
        deleteLeg: function(){
            this.$refs.spinner.show();

            this.$http.delete('/api/legislacao/'+this.id)
            .then( function(response) { 
                messageL.showMsg(response.body);
                window.location.href = '/legislacao';
                this.$refs.spinner.hide();                
            })
            .catch( function(error) { 
                console.error(error); 
            });
        } 
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

            this.loadOrgs();
            this.loadClasses();
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})