Vue.component('classe-donos', {
    template: `
<ul style="padding-left:20px">
    <li v-for="d in donos">
        <div v-if="d.idTipo == 'Entidade'">
            <a :href="'/entidades/' + d.idDono"> {{ d.sigla }} </a>
            - {{ d.designacao }}
        </div>
        <div v-else>
            <a :href="'/tipologias/' + d.idDono"> {{ d.sigla }} </a>
            - {{ d.designacao }}
        </div>
    </li>
</ul>`,
    props: {
            donos: Array
        }
})
