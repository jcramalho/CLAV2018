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

            this.$http.get("/api/classes")
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
                            title: pn.PaiTitulo.value,
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
                        title: pn.AvoTitulo.value,
                        drop: false,
                        subReady: true,
                        sublevel: [{
                            codeID: pn.Pai.value.replace(/[^#]+#(.*)/, '$1'),
                            content: [codePai, pn.PaiTitulo.value],
                            title: pn.PaiTitulo.value,
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
                    title: pn.PNTitulo.value,
                    indexTerms: pn.TermosIndice.value.split('###'),
                    drop: false,
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
                            content: [filhoInfo[1], filhoInfo[2]],
                            title: filhoInfo[2],
                            indexTerms: indexFilho,
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