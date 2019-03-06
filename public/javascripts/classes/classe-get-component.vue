/*     
    Componente que faz o render de uma classe.

    Recebe como parâmetro o id da classe: idClasse.
*/

Vue.component('select-value-from-list', {
  template: `
    <select v-model="currentValue">
        <option v-for='op in options' :value='op.value'>
            {{op.label}}
        </option>
    </select>
  `,
  props: {
      initialValue: {
          type: String
      },
      options: {
          type: Array,
          required: true
      }
  },
  
  data: function() {
      return {
          currentValue: "Indefinido"
      }
  },
  watch: {
        currentValue: function () {
            this.$emit('value-change', this.currentValue);
        }
  },
  created: function() {
      if(this.initialValue)
        this.currentValue = this.initialValue;
  }
})
