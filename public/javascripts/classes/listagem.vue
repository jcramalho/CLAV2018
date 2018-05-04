var classes = new Vue({
    el: '#tabela-classes',
    data: {
        subReady: {},
        tableHeader: [],
        tableData: [],
        ready: false,
        content: [],
        cwidth: ['9%','88%'],
        subTemp: [],
        nEdits: 0,
    },
    methods: {
        rowClicked: function(params){
            window.location.href = '/classes/consultar/c'+params.rowData[0];
        },
        loadClasses: function() {
            this.ready=false;
            let content = [];

            this.$http.get("/api/classes/filtrar")
                .then(function (response) {
                    content = response.body;
                })
                .then(function () {
                    this.tableData = this.parseClasses(content);

                    this.ready = true;
                })
                .catch(function (error) {
                    console.error(error);
                });
        },
        parseClasses: function (dataToParse) {
            var destination = [];
            const indexes = {};
            let avo;
            let pai;

            let level= this.level;
            let activeClass= this.activeClass;

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