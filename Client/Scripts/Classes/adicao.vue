var newClass = new Vue({
    el: '#nova-classe-form',
    http: {
        emulateJSON: true,
        emulateHTTP: true
    },
    data: {
        type: 1,

        parent: "",
        parents: [],
        parentsReady: false,

        code: "",
        
        title: "",
        
        newOwner: "",
        ownerList: [],
        orgList: [],
        orgsReady: false,
        
        newLegislation: "",
        newLegList: [],
        legList: [],
        legsReady: false,
        
        description: "",
        
        newExAppNote: "",
        exAppNotes: [],
        
        newAppNote: "",
        appNotes: [],
        
        newDelNote: "",
        delNotes: [],
        
        status: "",
        
        procType: "",

        procTrans: "",

        newParticipantType: "",
        newParticipant: "",
        participants: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Executor: [],
            Iniciador: [],
        },

        newRelProc: "",
        relProcs: [],
        classList: [],
        classesReady: false,

        message: "",
    },
    watch: {
        parent: function () {
            this.code = this.parent.slice(1, this.parent.length);
        },
        type: function () {
            this.parent = "";
            if (this.type > 1) {
                this.loadParents();
            }
        },
        code: function () {
            if(this.type>1){
                if(this.code.indexOf(this.parent) != 0){
                    this.code=this.parent.slice(1, this.parent.length)+".";
                }
                if(this.code[this.parent.length]!='.'){
                    this.code=this.parent.slice(1, this.parent.length)+".";   
                }
            }
            else{
                //if(this.code)
            }
        }
    },
    methods: {
        loadClasses: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/classesn?level=3")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.classList = JSON.parse(JSON.stringify(this.parse(classesToParse, keys)));
                    this.classesReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
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
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadLegs: function () {
            var legsToParse = [];
            var keys = ["id", "Número", "Titulo"];

            this.$http.get("/legs")
                .then(function (response) {
                    legsToParse = response.body;
                })
                .then(function () {
                    this.legList = this.parse(legsToParse, keys);
                    this.legsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParents: function () {
            var classesToParse = [];
            var keys = ["id", "Code"];

            this.$http.get("/classesn?level=" + (this.type - 1))
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.parents = this.parse(classesToParse, keys);
                    this.parentsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
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
        addNewExAppNote: function () {
            if (this.newExAppNote) {
                this.exAppNotes.push(this.newExAppNote);
                this.newExAppNote = '';
            }
        },
        addNewAppNote: function () {
            if (this.newAppNote) {
                this.appNotes.push({
                    id: "",
                    Note: this.newAppNote
                });
                this.newAppNote = '';
            }
        },
        addNewDelNote: function () {
            if (this.newDelNote) {
                this.delNotes.push({
                    id: "",
                    Note: this.newDelNote
                });
                this.newDelNote = '';
            }
        },
        createAppNotes: function (code, list) {
            var dataObj = [];

            for (var i = 0; i < list.length; i++) {
                var temp = {
                    id: "",
                    text: "",
                };

                temp.id = "na_c" + code + "_" + (i + 1);
                temp.text = list[i];

                dataObj[i] = JSON.parse(JSON.stringify(temp));
            }

            this.$http.post('/createAppNotes', { "list": dataObj },{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then(function (response) {
                this.message = response.body;
            })
            .catch(function (error) {
                console.error(error);
            });
        },
        createDelNotes: function (code, list) {
            var dataObj = [];
            
            for (var i = 0; i < list.length; i++) {
                var temp = { id: "", text: "" };

                temp.id = "ne_c" + code + "_" + (i + 1);
                temp.text = list[i];

                dataObj[i] = JSON.parse(JSON.stringify(temp));
            }

            this.$http.post('/createDelNotes', { "list": dataObj },{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then(function (response) {
                this.message = response.body;
            })
            .catch(function (error) {
                console.error(error);
            });
        },
        add: function () {
            for (var i = 0; i < this.appNotes.length; i++) {
                this.appNotes[i].id = "na_c" + this.code + "_" + (i + 1);
            }
            for (var i = 0; i < this.delNotes.length; i++) {
                this.delNotes[i].id = "ne_c" + this.code + "_" + (i + 1);
            }

            var dataObj = {
                Level: this.type,
                Parent: this.parent,
                Code: this.code,
                Title: this.title,
                Status: this.status,
                Owners: this.ownerList,
                Legislations: this.newLegList,
                Description: this.description,
                ExAppNotes: this.exAppNotes,
                AppNotes: this.appNotes,
                DelNotes: this.delNotes,
            };

            this.$http.post('/createClass',dataObj,{
                headers: {
                    'content-type' : 'application/json'
                }
            })
            .then( function(response) { 
                this.message = response.body;
            })
            .catch( function(error) { 
                console.error(error); 
            });
        }
    },
    created: function () {
        this.loadOrgs();
        this.loadLegs();
    }
})