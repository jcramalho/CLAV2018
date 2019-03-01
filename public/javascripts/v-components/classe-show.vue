Vue.component('classe-show', {
    props: ['novaClasse'],
    template: `
<div>
<h3> {{ novaClasse.codigo }} - {{ novaClasse.titulo }} </h3>

<table class="table table-bordered">
    <tr>
        <th>Classe Pai: </th>
        <td> {{ novaClasse.pai.codigo }} - {{ novaClasse.pai.titulo}} </td>
    </tr>
    <tr v-if="novaClasse.descricao.length > 0">
        <th>Descrição: </th>
        <td> {{ novaClasse.descricao }} </td>
    </tr>
    <tr v-if="novaClasse.notasAp.length > 0">
        <th>Nota(s) de Aplicação: </th>
        <td>
            <ul style="padding-left:20px">
                <li v-for="nota in novaClasse.notasAp"> {{nota.conteudo}} </li>
            </ul>
        </td>
    </tr>
</table>
</div>`,

    mounted: function(){
        console.log(JSON.stringify(this.novaClasse));
    }
})