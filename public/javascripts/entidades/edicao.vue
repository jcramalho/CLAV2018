var org = new Vue({
    el: '#organizacao-form',
    data: {
        id: "",
        type: "",

        entName: "",
        newName: "",
        editName: false,

        entInitials: "",
        content: [],
        message: "",
        delConfirm: false,

        entInternational: "",
        newInternational: "",
        editInternational: false,

        domain: [],
        newClass: "",
        newDomain: [],
        domainReady: false,
        editDomain: false,

        participations: [],
        newPartType: "",
        newPart: "",
        newParticipations: [],
        partsReady: false,
        editParts: false,

        classList: [],

        partsCollapsed: {
            Apreciador: true,
            Assessor: true,
            Comunicador: true,
            Decisor: true,
            Executor: true,
            Iniciador: true,
        },
        domainCollapsed: true,

        editTipol: false,
        newTipol: "",
        tipolList: [],
        myTipolList: [],
        myNewTipolList: [],

        participationsDic: {
            Apreciador: "Apreciar",
            Assessor: "Assessorar",
            Comunicador: "Comunicar",
            Decisor: "Decidir",
            Executor: "Executar",
            Iniciador: "Iniciar"
        }

    },
    computed: {
        partOptions: function(){
            var dictionary = this.participationsDic;
            return Object.keys(this.participations).map(
                function(a){
                    return{
                        label: dictionary[a],
                        value: a
                    }
                }
            )
        }
    },
    components: {
        spinner: VueStrap.spinner,
        modal: VueStrap.modal,
    },
    methods: {
        subtractArray: function (from, minus) {
            var ret;

            if (!from) {
                ret = null;
            }
            else if (!minus) {
                ret = JSON.parse(JSON.stringify(from));
            }
            else {
                ret = from.filter(function (item) {
                    var r = true;
                    for (var i = 0; i < minus.length; i++) {
                        if (minus[i].id == item.id) {
                            r = false;
                            break;
                        }
                    }

                    return r;
                });
            }

            return ret;
        },
        loadClasses: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/classes/nivel=3")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.classList = this.parseList(classesToParse, keys).map(function (item) {
                        return {
                            label: item.Code + " - " + item.Title,
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
        loadTipolList: function () {
            var dataToParse = [];
            var keys = ["id", "Designacao", "Sigla"];

            this.$http.get("/api/tipologias")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    var completeList = this.parseList(dataToParse, keys);

                    this.tipolList = completeList.map(function (item) {
                        return {
                            label: item.Sigla +"-"+ item.Designacao,
                            value: item,
                        }
                    }).sort(function (a, b) {
                        return a.label.localeCompare(b.label);
                    });


                    this.tipolsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadDomain: function () {
            var classesToParse = [];
            var keys = ["id", "Code", "Title"];

            this.$http.get("/api/entidades/" + this.id+"/dominio")
                .then(function (response) {
                    classesToParse = response.body;
                })
                .then(function () {
                    this.domain = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));
                    this.newDomain = JSON.parse(JSON.stringify(this.parseList(classesToParse, keys)));

                    this.domainReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadParticipations: function () {
            var partsToParse = [];
            var keys = ['id', 'Title', 'Code'];

            this.$http.get("/api/entidades/" + this.id + "/participacoes")
                .then(function (response) {
                    partsToParse = response.body;
                })
                .then(function () {
                    this.participations = this.parseParticipants(partsToParse, keys);
                    this.newParticipations = JSON.parse(JSON.stringify(this.participations));

                    this.partsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        loadTipols: function () {
            var dataToParse = [];
            var keys = ["id", "Designacao", "Sigla"];

            this.$http.get("/api/entidades/" + this.id + "/tipologias")
                .then(function (response) {
                    dataToParse = response.body;
                })
                .then(function () {
                    this.myTipolList = this.parseList(dataToParse, keys);
                    this.myNewTipolList = JSON.parse(JSON.stringify(this.myTipolList));

                    this.tipolsReady = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parse: function (content) {
            this.entName = content[0].Designacao.value;
            this.newName = content[0].Designacao.value;
            this.entInitials = content[0].Sigla.value;
            this.entInternational = content[0].Internacional.value;
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
                var type = content[i].Type.value.replace(/.*temParticipante(.*)/, '$1');

                dest[type].push(JSON.parse(JSON.stringify(temp)));
            }

            var types = Object.keys(dest);

            for (var i = 0; i < types.length; i++) {
                dest[types[i]] = dest[types[i]].sort(function (a, b) {
                    return a.id.localeCompare(b.id);
                });
            }

            return dest;
        },
        update: function () {
            this.$refs.spinner.show();            

            var dataObj = {
                id: this.id,
                international: null,
                name: null,
                domain: {
                    add: null,
                    del: null,
                },
                parts: {
                    Apreciador: {
                        add: null,
                        del: null,
                    },
                    Assessor: {
                        add: null,
                        del: null,
                    },
                    Comunicador: {
                        add: null,
                        del: null,
                    },
                    Decisor: {
                        add: null,
                        del: null,
                    },
                    Executor: {
                        add: null,
                        del: null,
                    },
                    Iniciador: {
                        add: null,
                        del: null,
                    },
                },
                tipols: {
                    add: null,
                    del: null,
                },
            }

            if (this.editName) {
                dataObj.name = this.newName;
            }
            if (this.editInternational) {
                dataObj.international = this.newInternational;
            }
            if (this.editDomain) {

                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.newDomain, this.domain);
                temp.del = this.subtractArray(this.domain, this.newDomain);

                dataObj.domain = JSON.parse(JSON.stringify(temp));
            }
            if (this.editParts) {
                for (const pType in this.participations) {

                    var temp = {
                        add: null,
                        del: null,
                    };

                    temp.add = this.subtractArray(this.newParticipations[pType], this.participations[pType]);
                    temp.del = this.subtractArray(this.participations[pType], this.newParticipations[pType]);

                    dataObj.parts[pType] = JSON.parse(JSON.stringify(temp));
                }
            }
            if (this.editTipol) {
                var temp = {
                    add: null,
                    delete: null,
                };

                temp.add = this.subtractArray(this.myNewTipolList, this.myTipolList);
                temp.del = this.subtractArray(this.myTipolList, this.myNewTipolList);

                dataObj.tipols = JSON.parse(JSON.stringify(temp));
            }

            this.$http.put('/api/entidades/'+this.id, dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            })
                .then(function (response) {
                    this.$refs.spinner.hide();
                    
                    var resp = response.body;
                    if (resp != "Designação já existentente!") {
                        window.location.href = '/entidades/consultar/' + this.id;
                    } else {
                        messageL.showMsg(resp);
                    }
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        deleteOrg: function () {
            this.$refs.spinner.show();
            
            this.$http.delete('/api/entidades/'+this.id)
                .then(function (response) {
                    this.$refs.spinner.hide();

                    messageL.showMsg(response.body);
                    window.location.href = '/entidades';
                })
                .catch(function (error) {
                    console.error(error);
                });
        }
    },
    created: function () {
        this.id = window.location.pathname.split('/')[3];
        
        this.$http.get("/api/entidades/" + this.id)
            .then(function (response) {
                this.parse(response.body);
            })
            .then(function () {
                this.loadDomain();
                this.loadParticipations();
                this.loadClasses();
                this.loadTipols();
                this.loadTipolList();
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})