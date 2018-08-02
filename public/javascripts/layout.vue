var users = new Vue({
    el: '#navbartop',
    data: {
        location: null,
        linhas: [
            {
                valor: 'Lista Consolidada',
                consultar: '/classes',
                submeter: '/classes/adicionar',
                style: `
                    padding-left:10px; 
                    border-left-width:2px; 
                    border-color: white;
                    border-left-style:  inset
                `,
                newCons: 'Consultar e propor alteração',
                newSub: 'Submeter novo PN'
            },
            {
                valor: 'Tabelas de Seleção',
                consultar: '/tabelasSelecao',
                submeter: '/tabelasSelecao/submeter/passos',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
            {
                valor: 'Autos de Eliminação',
                consultar: '#',
                submeter: '#',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
            {
                valor: 'Entidades',
                consultar: '/entidades',
                submeter: '/entidades/adicionar',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
            {
                valor: 'Tipologias',
                consultar: '/tipologias',
                submeter: '/tipologias/adicionar',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
            {
                valor: 'Legislação',
                consultar: '/legislacao',
                submeter: '/legislacao/adicionar',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
            {
                valor: 'Estatísticas',
                consultar: '#',
                submeter: '#',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
            {
                valor: 'Termos de Índice',
                consultar: '/termosIndice',
                submeter: '#',
                style: `
                    border-width:1px;
                    border-color: #5c6bc0;
                    border-left-style:  outset
                `
            },
        ],
    },
    components:{
        accordion: VueStrap.accordion,
        panel: VueStrap.panel
    },
    created() {
        this.location= window.location.pathname+window.location.search;
    }
})


var messageL = new Vue({
    el: '#message',
    data: {
        modalMsg:"",
        modalMsgShow:false,
    },
    components: {
        modal: VueStrap.modal,
    },
    methods: {
        showMsg(text) {
            this.modalMsg = text;
            this.modalMsgShow = true;
        }
    }
})