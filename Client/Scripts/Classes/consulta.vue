var classe = new Vue({
    el: '#classe-form',
    data: {
        id: "",
        orgList: [],
        legList: [],
        classList: [],
        clas: {
            Title: "",
            Code: "",
            Parent: {
                id: "",
                code: "",
                title: "",
            },
            Status: "",
            Desc: "",
            ProcType: "",
            ProcTrans: "",
            Owners: [],
            Legs: [],
            AppNotes: [],
            DelNotes: [],
            RelProcs: [],
            Participants: [],
        },
        newClass: {
            Title: "",
            Status: "",
            Desc: "",
            ProcType: "",
            ProcTrans: "",
            Owner: "",
            Owners: [],
            Leg: "",
            Legs: [],
            ExAppNote: "",
            ExAppNotes: [],
            AppNote: "",
            AppNotes: [],
            DelNote: "",
            DelNotes: [],
            RelProc: "",
            RelProcs: [],
        },
        edit: {
            Title: false,
            Status: false,
            Desc: false,
            ProcType: false,
            ProcTrans: false,
            Owners: false,
            Legs: false,
            ExAppNotes: false,
            AppNotes: false,
            DelNotes: false,
            RelProcs: false,
        },  
        orgsReady: false,
        ownersReady: false,
        legListReady: false,
        legsReady: false, 
        exAppNotesReady: false,
        appNotesReady: false,
        delNotesReady: false, 
        classesReady: false,
        relProcsReady: false, 
    },
    methods: {
        getParameterByName: function(name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        cleanOrgs: function(){
            for(var i=0; i<this.newClass.Owners.length;i++){
                for(var j=0; j<this.orgList.length; j++) {
                    if(this.orgList[j].id==this.newClass.Owners[i].id){
                        this.orgList.splice(j,1);
                    }
                }
            }
        },
        loadOrgs: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla", "Nome"];

            this.$http.get("/orgs")
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    this.orgList = this.parse(orgsToParse, keys);
                    this.orgsReady = true;

                    if(this.ownersReady){
                        this.cleanOrgs;
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        },   
        loadOwners: function () {
            var orgsToParse = [];
            var keys = ["id", "Sigla", "Nome"];

            this.$http.get("/ownersClass?id="+this.id)
                .then(function (response) {
                    orgsToParse = response.body;
                })
                .then(function () {
                    this.clas.Owners = this.parse(orgsToParse, keys);
                    this.newClass.Owners = this.parse(orgsToParse, keys);
                    
                    this.ownersReady = true;
                    
                    if(this.orgsReady){
                        this.cleanOrgs;
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadLegList: function () {
            var legsToParse = [];
            var keys = ["id", "Número", "Titulo"];

            this.$http.get("/legs")
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    this.legList = this.parse(legsToParse, keys);
                    this.legListReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },   
        loadLegs: function () {
            var legsToParse = [];
            var keys = ["id", "Número", "Titulo"];

            this.$http.get("/legsClass?id="+this.id)
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    this.clas.Legs = this.parse(legsToParse, keys);
                    this.newClass.Legs = this.parse(legsToParse, keys);
                    
                    this.legsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadAppNotes: function () {
            var notesToParse = [];
            var keys = ["id", "Nota"];

            this.$http.get("/appNotesClass?id="+this.id)
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.AppNotes = this.parse(notesToParse, keys);
                    this.newClass.AppNotes = this.parse(notesToParse, keys);
                    
                    this.appNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadDelNotes: function () {
            var notesToParse = [];
            var keys = ["id", "Nota"];

            this.$http.get("/delNotesClass?id="+this.id)
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.DelNotes = this.parse(notesToParse, keys);
                    this.newClass.DelNotes = this.parse(notesToParse, keys);
                    
                    this.DelNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadExAppNotes: function () {
            var notesToParse = [];
            var keys = ["Exemplo"];

            this.$http.get("/exAppNotesClass?id="+this.id)
                .then(function (response) {
                    notesToParse = response.body;
                })
                .then(function () {
                    this.clas.ExAppNotes = this.parse(notesToParse, keys);
                    this.newClass.ExAppNotes = this.parse(notesToParse, keys);
                    
                    this.exAppNotesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadClasses: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/classesn?level=3")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.classList = this.parse(classesToParse, keys);
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        }, 
        loadRelProcs: function () {
            var relProcsToParse = [];
            var keys = ["id","Code","Title"];

            this.$http.get("/relProcsClass?id="+this.id)
                .then(function (response) {
                    relProcsToParse = response.body;
                })
                .then(function () {
                    this.clas.RelProcs = this.parse(relProcsToParse, keys);
                    this.newClass.RelProcs = this.parse(relProcsToParse, keys);
                    
                    this.relProcsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipants: function () {
            var participantsToParse = [];
            var keys = ['id', 'Name', 'Initials'];

            this.$http.get("/participantsClass?id="+this.id)
                .then(function (response) {
                    participantsToParse = response.body;
                })
                .then(function () {
                    this.clas.Participants = this.parseParticipants(participantsToParse, keys);
                    this.newClass.Participants =JSON.parse(JSON.stringify(this.clas.Participants));
                    
                    this.participantsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseParticipants: function (content, keys) {
            var dest = {
                Apreciador: [],
                Assessor: [],
                Comunicador: [],
                Decisor: [],
                Executor: [],
                Iniciador: [],
            };
            var temp = {};

            // parsing the JSON
            for (var i = 0; i < content.length; i++) {
                for (var j = 0; j < keys.length; j++) {
                    
                    temp[keys[j]] = content[i][keys[j]].value;

                    if (keys[j] == "id") {
                        temp.id = temp.id.replace(/[^#]+#(.*)/, '$1');
                    }
                }
                var type = content[i].Type.value.replace(/.*temParticipante(.*)/,'$1');

                dest[type].push(JSON.parse(JSON.stringify(temp)));
            }

            return dest;
        },
        parse: function (content, keys) {
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

            return dest;
        },
        prepData: function(dataObj){   
            this.clas.Title=dataObj.Titulo.value;
            this.clas.Code=dataObj.Codigo.value;

            console.log()

            if(dataObj.Pai){
                this.clas.Parent.id=dataObj.Pai.value.replace(/[^#]+#(.*)/, '$1');
                this.clas.Parent.code=dataObj.CodigoPai.value;
                this.clas.Parent.title=dataObj.TituloPai.value;
            }
            if(dataObj.Status){
                this.clas.Status=dataObj.Status.value;
            }
            if(dataObj.Desc){
                this.clas.Desc=dataObj.Desc.value;
            }
            if(dataObj.ProcTipo){
                this.clas.ProcType=dataObj.ProcTipo.value;
            }
            if(dataObj.ProcTrans){
                this.clas.ProcTrans=dataObj.ProcTrans.value;
            }
            
            this.loadOwners();
            this.loadOrgs();

            this.loadLegs();
            this.loadLegList();

            this.loadExAppNotes();
            this.loadAppNotes();
            this.loadDelNotes();

            this.loadClasses();
            this.loadRelProcs();
            
            this.loadParticipants();
        },
        update: function(){
            /*var args='?id='+this.id;

            if(this.editName && this.newName){
                args+='&name='+this.newName;
            }
            if(this.editInitials && this.newInitials){
                args+='&initials='+this.newInitials;
            }

            this.$http.get('/updateOrg'+args)
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });*/
        },
        addOwner: function (index) {
            this.newClass.Owners.push(this.orgList[index]);
            this.orgList.splice(index, 1);
        },
        remOwner: function (index) {
            this.orgList.push(this.newClass.Owners[index]);
            this.newClass.Owners.splice(index, 1);

            this.orgList.sort(function(a,b) {
                return a.Sigla.localeCompare(b.Sigla);
            });
        },
        addLeg: function (index) {
            this.newClass.Legs.push(this.legList[index]);
            this.legList.splice(index, 1);
        },
        remLeg: function (index) {
            this.legList.push(this.newClass.Legs[index]);
            this.newClass.Legs.splice(index, 1);
        },
        addNewExAppNote: function () {
            if (this.newClass.ExAppNote) {
                this.newClass.ExAppNotes.push({Exemplo: this.newClass.ExAppNote});
                this.newClass.ExAppNote = '';
            }
        },
        addNewAppNote: function () {
            if (this.newClass.AppNote) {
                this.newClass.AppNotes.push({Nota: this.newClass.AppNote});
                this.newClass.AppNote = '';
            }
        },
        addNewDelNote: function () {
            if (this.newClass.DelNote) {
                this.newClass.DelNotes.push({Nota: this.newClass.DelNote});
                this.newClass.DelNote = '';
            }
        },
        delReady: function(){
            this.message="Tem a certeza que deseja apagar?";
            this.delConfirm=true;
        },
        delNotReady: function(){
            this.message= "";
            this.delConfirm=false;
        },
        deleteClass: function(){
            this.$http.post('/deleteClass',{id: this.id})
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });
        } 
    },
    created: function(){
        this.id=this.getParameterByName('id');
        this.clas.Level=this.id.split('.').length;

        var content;

        this.$http.get("/singleClass?id="+this.id)
        .then( function(response) { 
            content = response.body;
        })
        .then( function() {
            this.prepData(content[0]);
        })
        .catch( function(error) { 
            console.error(error); 
        });
    }
})