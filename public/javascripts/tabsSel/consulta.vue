var tabSel = new Vue({
    el: '#tabela-selecao',
    data: {
        subReady: {},
        tableHeader: [],
        tableData: [],
        ready: false,
        cwidth: ['15%', '81%'],
        nEdits: 0,
        name: "",
        id: null,
    },
    methods: {
        rowClicked: function(params){
            window.location.href = '/classes/consultar/'+this.id+'_c'+params.rowData[0];
        },
        parseClasses: function (dataToParse) {
            var destination = [];
            const indexes = {};
            let avo;
            let pai;

            let level = this.level;
            let activeClass = this.activeClass;

            for (let pn of dataToParse) {
                let codeAvo = pn.AvoCodigo.value;
                let indexesAvo = indexes[codeAvo];
                let codePai = pn.PaiCodigo.value;

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
                            content: [codePai, pn.PaiTitulo.value],
                            drop: false,
                            subReady: true,
                            sublevel: []
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
                        content: [codeAvo, pn.AvoTitulo.value],
                        drop: false,
                        subReady: true,
                        sublevel: [{
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai, pn.PaiTitulo.value],
                            drop: false,
                            subReady: true,
                            sublevel: [],
                        }]
                    }
                    destination.push(infoAvo);
                }

                let pninfo = {
                    codeID: pn.PN.value.replace(/[^#]+#(.*)/, '$1'),
                    content: [pn.PNCodigo.value, pn.PNTitulo.value],
                    drop: false,
                }

                if (pn.Filhos.value.length) {
                    pninfo.subReady = true;
                    pninfo.sublevel = [];

                    for (let filho of pn.Filhos.value.split('###')) {
                        let filhoInfo = filho.split(':::');

                        pninfo.sublevel.push({
                            codeID: filhoInfo[0].replace(/[^#]+#(.*)/, '$1'),
                            content: [filhoInfo[1], filhoInfo[2]],
                            drop: false,
                        });
                    }
                }
                destination[avo].sublevel[pai].sublevel.push(pninfo);
            }
            return destination;
        },
    },
    created: function () {
        this.tableHeader = [
            "CLASSE",
            "TÍTULO"
        ];

        this.id = window.location.pathname.split('/')[3];

        this.$http.get("/api/tabelasSelecao/" + this.id)
            .then(function (response) {
                this.name = response.body[0].Name.value;
            })
            .catch(function (error) {
                console.error(error);
            });

        var content
        this.$http.get("/api/tabelasSelecao/" + this.id + "/classes")
            .then(function (response) {
                content = response.body;
            })
            .then(function () {
                console.log(content);
                this.tableData = this.parseClasses(content);
                this.ready = true;
            })
            .catch(function (error) {
                console.error(error);
            });
    }
})