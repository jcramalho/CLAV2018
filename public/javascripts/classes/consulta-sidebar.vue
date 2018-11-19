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
            alert(JSON.stringify(params))
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

        /* loadClasses: function() {
            this.ready=false;
            let content = [];

            let TS = /^ts_/;

            let link;

            if(TS.test(this.activeClass)){
                link = "/api/tabelasSelecao/"+this.activeClass.replace(/(ts_[0-9]+).+/,"$1")+"/classes";
            }
            else {
                link = "/api/classes";
            }

            this.$http.get(link)
                .then(function (response) {
                    this.tableData = response.body;
                    this.ready = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        }, */
        /* parseClasses: function (dataToParse) {
            var destination = [];
            const indexes = {};
            let avo;
            let pai;

            let active= this.activeClass.replace(/.*c([0-9]{3}.*)/,"$1");
            this.activeClass=this.activeClass.replace(/.*c([0-9]{3}.*)\d/,"$1");

            for (let pn of dataToParse) {
                let codeAvo = pn.AvoCodigo.value;
                let indexesAvo = indexes[codeAvo];
                let codePai = pn.PaiCodigo.value;

                let pnSelected = false;


                if (indexesAvo) {
                    avo = indexesAvo.i;

                    if (indexesAvo.sub[codePai] != undefined) {
                        pai = indexesAvo.sub[codePai];
                    }
                    else {
                        pai = Object.keys(indexesAvo.sub).length;

                        indexes[codeAvo].sub[codePai] = pai;

                        let infoPai = {
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai],
                            title: pn.PaiTitulo.value,
                            drop: this.activeClass.includes(codePai),
                            selected: pnSelected,
                            subReady: true,
                            sublevel: [],
                            active: active==codePai
                        }
                        destination[avo].sublevel.push(infoPai);
                    }
                }
                else {
                    avo = Object.keys(indexes).length;
                    pai = 0;

                    indexes[codeAvo] = { i: avo, sub: {} };
                    indexes[codeAvo].sub[codePai] = pai;

                    let infoAvo = {
                        codeID: pn.Avo.value.replace(/[^#]+#(.*)/, '$1'),
                        content: [codeAvo],
                        title: pn.AvoTitulo.value,
                        drop: this.activeClass.includes(codeAvo),
                        selected: pnSelected,
                        subReady: true,
                        active: active==codeAvo,
                        sublevel: [{
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai],
                            title: pn.PaiTitulo.value,
                            drop: this.activeClass.includes(codePai),
                            selected: pnSelected,
                            subReady: true,
                            sublevel: [],
                            active: active==codePai
                        }]
                    }
                    destination.push(infoAvo);
                }

                let pninfo = {
                    codeID: pn.PN.value.replace(/[^#]+#(.*)/, '$1'),
                    content: [pn.PNCodigo.value],
                    title: pn.PNTitulo.value,
                    indexTerms: pn.TermosPesquisa.value.split('###'),
                    drop: this.activeClass.includes(pn.PNCodigo.value),
                    selected: pnSelected,
                    active: active==pn.PNCodigo.value
                }

                if (pn.Filhos.value.length) {
                    pninfo.subReady = true;
                    pninfo.sublevel = [];

                    let tisFilhos = [];
                    if(pn.TIsFilhos.value.length){
                        tisFilhos = pn.TIsFilhos.value.split('###').map(
                            function(ti){
                                let dados=ti.split(':::');
                                return {
                                    codigo:dados[0],
                                    termo:dados[1],
                                }
                            }
                        );
                    }

                    for (let filho of pn.Filhos.value.split('###')) {
                        let filhoInfo = filho.split(':::');
                        let indexFilho = [];

                        if(tisFilhos.length){
                            indexFilho = tisFilhos
                                .filter(a=>a.codigo==filhoInfo[1])
                                .map(a=>a.termo);
                        }

                        pninfo.sublevel.push({
                            codeID: filhoInfo[0].replace(/[^#]+#(.*)/, '$1'),
                            content: [filhoInfo[1]],
                            title: filhoInfo[2],
                            indexTerms: indexFilho,
                            drop: false,
                            selected: pnSelected,
                            active: active==filhoInfo[1]
                        });
                    }
                }
                destination[avo].sublevel[pai].sublevel.push(pninfo);
            }

            return destination;
        }, */
    },
    created: function(){
        this.activeClass = window.location.pathname.split('/')[3];
        this.loadClasses();
    }
})