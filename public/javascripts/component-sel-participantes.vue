/*     
    Componente que permite selecionar o tipo de intervenção;
    Sempre que o utilizador a muda é gerado um evento que envia o novo valor ao componente pai.

    Recebe como parâmetro um array de opções: options.
    Em que cada elemento é um objeto com dois campos: label e value.
*/

Vue.component('select-value-from-list', {
  template: `
    <select v-model="current-value">
        <option v-for='op in options' :value='op.value'>{{op.label}}</option>
    </select>
  `,
  props: {
      options: {
          type: Array,
          required: true
      }
  },
  data: function() {
      return {
          "current-value": "Por selecionar"
      }
  },
  watch: {
        current-value: function () {
            this.$emit('value-change', this.current-value);
        }
  }
})

Vue.component('tabela-selecao-participantes', {
    template: `
        <div style="padding-bottom:30px">
            <div class="col-sm-4">
                Mostrar
                <select v-model="rowsPerPage">
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>100</option>
                </select>
                entradas
            </div>
            <div class="col-sm-7">
                <input v-if="!nosearch" class="form-control" v-model="filt" type="text" placeholder="Filtrar"/>
            </div>

            <table :class="classTable">
                <thead v-if="header">
                    <tr>
                        <th style="width: 4%"></th>
                        <th v-if="index=>0" v-for="(item,index) in header" @click="sort(index)" class="sorter" :style="{width: cwidth[index]}">
                            {{ item }} <span class="caret"></span>
                        </th>
                    </tr>
                </thead>
                <tbody name="table">
                    <tr v-if="completeRows.length>0" v-for="(row,index) in rowsShow" :key="row[0]">
                        <td>
                            <input
                                type="checkbox"
                                v-model="row.selected"
                                @click="selectClicked(index)"
                            />
                        <td>{{ row.data[0] }}</td>
                        <td>{{ row.data[1] }}</td>
                        <td>{{ row.data[2] }}</td>
                        
                        <td>
                            <select-value-from-list 
                                :options = "[{label: 'Apreciar', value: 'Apreciador'},
                                            {label: 'Assessorar', value: 'Assessor'},
                                            {label: 'Comunicar', value: 'Comunicador'},
                                            {label: 'Decidir', value: 'Decisor'},
                                            {label: 'Executar', value: 'Executor'},
                                            {label: 'Iniciar', value: 'Iniciador'}]"
                                @value-change="mudarIntervencao($event, row)"
                            />
                        </td>
                    </tr>
                    <tr v-else>
                        <td colspan=3>Lista vazia.</td>
                    </tr>
                </tbody>
            </table>

            <div class="pages">
                <span class="glyphicon glyphicon-chevron-left page-number" @click="prevPage"></span>
                <span class="page-number btn btn-xs btn-default" v-for="page in pages" :class="{active: page==activePage}" @click="loadPage(page)" :disabled="isNaN(page)">\ {{ page }}\ </span>
                <span class="glyphicon glyphicon-chevron-right page-number" @click="nextPage"></span>
            </div>
        </div>
    `,
    props: [
        'classTable',
        'nosearch',
        'completeRows',
        'header',
        'ready',
        'cwidth',
    ],
    data: function () {
        return {
            "rows": [],
            "rowsShow": [[]],
            "filt": '',
            "order": 0,
            "activePage": 1,
            "pages": [0],
            "rowsPerPage": 10,
            "nPages": 1,
        };
    },
    watch: {
        filt: function () {
            this.completeFilter(this.filt);
        },
        rows: function () {
            this.loadPages();
        },
        rowsPerPage: function () {
            this.loadPages();
        },
        activePage: function () {
            this.loadPages();
            this.prepPage();
        },
    },
    methods: {
        mudarIntervencao: function(nova, entidade){
            entidade.data[3] = nova
        },
        selectRow: function (index) {
            this.$emit('select-clicked', this.rowsShow[index]);
            this.rowsShow[index].selected = !this.rowsShow[index].selected;
        },
        selectClicked: function (index) { //emit event when a row is selected
            this.$emit('select-clicked', this.rowsShow[index]);
        },
        completeFilter: function (filt) { //filter rows according to what is written in the input box
            tempRows = this.completeRows;

            filters = filt.split(" ");

            for (i = 0; i < filters.length; i++) {
                tempRows = this.filter(tempRows, filters[i]);
            }

            this.rows = tempRows;
        },
        filter: function (list, filt) {
            var retList;

            regex = new RegExp(filt, "gi");

            retList = list.filter(function (item) {
                if (item.selected) {
                    return true;
                }

                for (let cell of item.data) {
                    if (regex.test(cell)) {
                        return true;
                    }
                }
                return false;
            })
            if (retList.length == 0) {
                retList = [[]];
            }

            return retList;
        },
        sort: function (index) { //sort rows by header[index]
            if (this.order == index) {
                this.rows.reverse();
                this.order = -index;
            } else {
                this.rows.sort(function (a, b) {
                    if (typeof a.data[index] === 'string' || a.data[index] instanceof String)
                        return a.data[index].localeCompare(b.data[index]);
                    else
                        return a.data[index] - b.data[index];
                })
                this.order = index;
            }
        },
        loadPages: function () { //process page numbers
            var page = this.activePage;
            var ret = [];

            var n = Math.ceil(this.rows.length / this.rowsPerPage);

            this.nPages = n;

            if (n > 7) {
                if (page < 5) {
                    ret = [1, 2, 3, 4, 5, "...", n];
                }
                else if (page > n - 4) {
                    ret = [1, "...", n - 4, n - 3, n - 2, n - 1, n];
                }
                else {
                    ret = [1, "...", page - 1, page, page + 1, "...", n];
                }
            }
            else {
                for (var i = 1; i <= n; i++) {
                    ret.push(i);
                }
            }

            this.pages = ret;

            if (page > n) {
                this.loadPage(n);
            } else {
                this.prepPage();
            }
        },
        loadPage: function (page) { //change active page
            if (page != this.activePage && page > 0 && page <= this.nPages) {
                this.activePage = page;
            }
        },
        prepPage: function () { //process rows to be shown
            var beggining = (this.activePage - 1) * this.rowsPerPage;
            var end = beggining + parseInt(this.rowsPerPage);

            this.rowsShow = this.rows.slice(beggining, end);
        },
        nextPage: function () {
            this.loadPage(this.activePage + 1);
        },
        prevPage: function () {
            this.loadPage(this.activePage - 1);
        },
        firstLoad: function () { //loads info upon first render
            var ret = [];

            var n = Math.ceil(this.completeRows.length / this.rowsPerPage);

            for (var i = 1; i <= n; i++) {
                ret.push(i);
            }

            this.pages = ret;

            this.rowsShow = this.completeRows.slice(0, this.rowsPerPage);
        },
    },
    beforeMount: function () {
        this.firstLoad();
        this.rows = this.completeRows;
    }
})

Vue.component('v-select', VueSelect.VueSelect);
