var sideNav = new Vue({
    el: '#sideNav',
    data: {
        completeNav: [
            {
                label: "Nível",
                anchor: "#nivel",
                lvl: 1
            },
            {
                label: "Classe Pai",
                anchor: "#pai",
                lvl: 2
            },
            {
                label: "Código",
                anchor: "#codigo",
                lvl: 1
            },
            {
                label: "Título",
                anchor: "#titulo",
                lvl: 1
            },
            {
                label: "Descrição",
                anchor: "#descricao",
                lvl: 1
            },
            {
                label: "Notas de Aplicação",
                anchor: "#notasA",
                lvl: 1
            },
            {
                label: "Exemplos de Notas de Aplicação",
                anchor: "#exemplos",
                lvl: 1
            },
            {
                label: "Notas de Exclusão",
                anchor: "#notasE",
                lvl: 1
            },
            {
                label: "Termos de Índice",
                anchor: "#termosI",
                lvl: 3
            },
            {
                label: "Tipo de Processo",
                anchor: "#tipoTrans",
                lvl: 3
            },
            {
                label: "Processo Tranversal",
                anchor: "#tipTrans",
                lvl: 3
            },
            {
                label: "Donos",
                anchor: "#donos",
                lvl: 3
            },
            {
                label: "Participantes",
                anchor: "#participantes",
                lvl: 3
            },
            {
                label: "Processos Relacionados",
                anchor: "#PNrel",
                lvl: 3
            },
            {
                label: "Legislação",
                anchor: "#legislacao",
                lvl: 3
            },
            {
                label: "PCA",
                anchor: "#PCA",
                lvl: 3
            },
            {
                label: "Destino Final",
                anchor: "#DF",
                lvl: 3
            },
        ],
        sideNav: []
    },
    methods: {
        changeNav: function (type) {
            this.sideNav = this.completeNav.filter(
                a => a.lvl <= type
            )
        }
    },
    mounted() {
        this.changeNav(1);
    }
})
