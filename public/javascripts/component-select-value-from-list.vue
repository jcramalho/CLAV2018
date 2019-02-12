/*     
    Componente genérico que permite selecionar um valor da lista que é passada como parâmetro;
    Sempre que o utilizador muda o valor é gerado um evento que envia o novo valor ao componente pai.

    Recebe como parâmetro um array de opções: options.
    Em que cada elemento é um objeto com dois campos: label e value.
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
