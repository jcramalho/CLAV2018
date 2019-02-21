Vue.component('classe-participantes', {
    template: `
<ul style="padding-left:20px">
    <li v-for="(p, index) in this.participPorTipo" v-if="p.length > 0">
        {{ index }}:
            <ul>
                <li v-for="proc in p">
                    <a v-if="proc.idTipo == 'Entidade'" :href="'/entidades/' + proc.idParticipante"> {{ proc.sigla }} </a>
                    <a v-else :href="'/tipologias/' + proc.idParticipante"> {{ proc.sigla }} </a>
                    - {{ proc.designacao }} 
                </li>
            </ul>
    </li>
</ul>`,

    props: {
            participantes: []
        },

    data: function() {
      return {
          participPorTipo: {
            Apreciador: [],
            Assessor: [],
            Comunicador: [],
            Decisor: [],
            Executor: [],
            Iniciador: []
        },
        dataReady: false,
      }
    },

    created: function () {
        var tipo;
        for(var i=0; i < this.participantes.length; i++){
            tipo = this.participantes[i].participLabel;
            this.participPorTipo[tipo].push(this.participantes[i])
        }
        this.dataReady = true;
    }
})
