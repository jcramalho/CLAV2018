Vue.component('tabela-pedidos-por-tipo', {
    template: `
        <accordion class="info-classe">
            <panel class="p-3" :header="titulo" :is-open="open">
                <table class="table table-hover p-3" v-if="pedidos.length > 0">
                    <tr>
                        <th> Data </th>
                        <th> Estado </th> 
                        <th> Número </th>
                        <th> Responsável </th>
                        <th> Tipo </th>
                        <th> Novo objeto </th>
                    </tr>
                    <tr v-for="(p, index) in pedidos">
                        <td> {{p.data}} </td>
                        <td> {{p.estado}} </td> 
                        <td><a :href="'/pedidos/' + p.codigo"> {{p.codigo}} </a></td>
                        <td> {{p.criadoPor}} </td>
                        <td> {{p.objeto.acao}} -  {{p.objeto.tipo}} </td>
                        <td> Ver <button type="button" class="btn btn-info"> {{p.objeto.codigo}} </button> </td>
                    </tr>
                </table>
                <div class="row p-3" v-else> Não tem pedidos deste tipo.</div>
            </panel>
        </accordion>`,
    props: [
        'titulo',
        'pedidos'
    ],
    components: {
        accordion: VueStrap.accordion,
        panel: VueStrap.panel,
    },
    methods: {
        emitEvent: function (evento) {
            console.log(evento);
        }
    }
})