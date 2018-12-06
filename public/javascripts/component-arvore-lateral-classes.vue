Vue.component('linha-cascata-classes', {
    template: `
        <tr>
            <td colspan=6 :class="[root ? 'cascata-row-root' : 'cascata-row']">
                <table class="partial-hover cascata-table-within" :class="tableClass">
                    <tbody name="table">
                        <tr>
                            <td 
                                v-if="row.filhos.length>0" 
                                @click="row.drop=!row.drop"
                                :class="[(selectLeft && level>=3) ? 'cascata-drop-select cascata-plus' :'cascata-drop cascata-plus']"
                            >
                                <input
                                    v-if="selectLeft && level>=3"
                                    :id="'left'+id+suffix"
                                    type="checkbox"
                                    v-model="row.selected"
                                    @click="leftSelectClicked"
                                />
                                <span
                                    :for="'toggle'+id+suffix"
                                    :class="[row.drop ? 'glyphicon glyphicon-minus' : 'glyphicon glyphicon-plus']"
                                />
                            </td>
                            
                            <td v-else class="cascata-drop">
                                <input
                                    v-if="selectLeft && level>=3"
                                    :id="'left'+id+suffix"
                                    type="checkbox"
                                    v-model="row.selected"
                                    @click="leftSelectClicked"
                                />
                                <span style="padding-right:18px"></span>
                            </td>

                            <td class="cascata-codigo" :class="[row.active ? 'cascata-active' : '']" @click="rowClicked" :title="row.titulo">
                                {{ row.codigo }}
                            </td>
                        </tr>

                        <linha-cascata-classes v-if="row.drop && row.filhos.length>0"
                            v-for="filho in row.filhos"

                            :select-on="selectOn"
                            :select-left="selectLeft"
                            :id="filho.codigo"
                            :row="filho"
                            :key="filho.codigo"
                            :cwidth="cwidth"
                            :suffix="suffix"

                            @eventWaterfall="eventPass($event)"

                            :table-class="tableClass+' cascata'"
                        />
                    </tbody>
                </table>
            </td>
        </tr>
    `,
    props: [
        'row',
        'tableClass',
        'cwidth',
        'id',
        'selectOn',
        'selectLeft',
        'root',
        'suffix',
    ],
    data: function () {
        return {
            drop: {},
            selected: {},
            level: this.id.split('.').length,
        }
    },
    methods: {
        selectClicked: function () { //emit event when a row is selected
            var eventContent = {
                suffix: this.suffix,
                type: "select",
                params: {
                    id: this.id,
                    rowData: this.row
                }
            };
            
            this.$emit('eventWaterfall', eventContent);
        },
        leftSelectClicked: function () { //emit event when a row is selected
            var eventContent = {
                type: "left-select",
                suffix: this.suffix,
                id: this.id,
                rowData: this.row
            };
            
            this.$emit('eventWaterfall', eventContent);
        },
        dropClicked: function () { //emit event when a row is expanded
            var eventContent = {
                suffix: this.suffix,
                type: "drop",
                params: {
                    id: this.id,
                    rowData: this.row
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        rowClicked: function () { //emit event when a row is clicked
            var eventContent = {
                type: "row",
                params: {
                    id: 'c' + this.row.codigo,
                    trueID: this.row.id,
                    rowData: this.row
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        eventPass: function (event) { //pass up an event from child component
            this.$emit('eventWaterfall', event);
        }
    },
})

// Componente que faz a listagem da árvore de classes
Vue.component('tabela-cascata-classes', {
    template: `
        <div id="root" class="custom-table-waterfall">
            <div class="col-sm-1"  v-if="add" style="float:right">
                <button type="button" class="btn btn-default btn-circle" @click="addClick">
                    <span class="glyphicon glyphicon-plus"/>
                </button>
            </div>

            <table id="masterTable" :class="tableClass">
                <tbody name="table">
                    <tr v-if="rows.length==0">
                        <td colspan=6>
                            Nenhum resultado encontrado...
                        </td>
                    </tr>
                    <linha-cascata-classes
                        v-if="rows.length>0"
                        v-for="row in rows"

                        :select-on="selectOn"
                        :select-left="selectLeft"
                        :row="row"
                        :id="row.codigo"
                        :key="row.codigo"
                        :cwidth="cwidth"
                        :suffix="suffix"

                        :table-class="tableClass+' cascata'"
                        root="true"

                        @eventWaterfall="eventPass($event)"
                    />
                </tbody>
            </table>
        </div>
    `,
    props: [
        'cwidth',
        'table-class',
        'url',
        'completeRows',
        'header',
        'add',
        'selectOn',
        'selectLeft',
        'nEdits',
        'suffix',
        'sidebar'
    ],
    data: function () {
        return {
            "rows": [],
            "order": 0
        };
    },
    watch: {
        nEdits: function () {
            if (this.filtered) {
                this.newFilter();
            }
        }
    },
    methods: {
        completeFilter: function (filt) { //filter rows according to what is written in the input box
            this.filtError=false;
            let tempRows = [];
            let classesList = [];

            let codeFormats = [{ level: 1, format: /^[0-9]{3}$/}, 
                                   { level: 2, format: /^[0-9]{3}\.[0-9]{2}$/},
                                   { level: 3, format: /^[0-9]{3}\.[0-9]{2}\.[0-9]{3}$/},
                                   { level: 4, format: /^[0-9]{3}\.[0-9]{2}\.[0-9]{3}\.[0-9]{2}$/} ];

                this.$http.get("/api/classes/lista")
                    .then(function (response) {
                        classesList = response.body; 

                        if(filt!=""){
                            let filters = filt.split(" ");
                            for (let f of filters) {
                                if(codeFormats.filter(codef => codef.format.test(f)).length > 0){
                                    tempRows = classesList.filter(classe => classe.codigo.indexOf(f) !== -1);
                                }
                                else{
                                    tempRows = classesList.filter(classe => classe.titulo.indexOf(f) !== -1);                
                                }
                            }
                            this.rows = tempRows;
                        }
                    })
                    .catch(function (error) {
                        console.error(error);
                    });
        },
        sort: function (index) { //sort rows by header[index]
            if (this.order == index) {
                this.rows.reverse();
                this.order = -index;
            } 
            else {
                this.rows.sort(function (a, b) {
                    if (typeof a.content[index] === 'string' || a.content[index] instanceof String)
                        return a.content[index].localeCompare(b.content[index]);
                    else
                        return a.content[index] - b.content[index];
                })
                this.order = index;
            }
        },
        
        eventPass: function (event) { //process event comming from child component
            if (event.type == "row") {
                this.$emit('row-clicked', event.params);
            }
            else if (event.type == "drop") {
                if (event.suffix) {
                    this.$emit('drop-clicked-' + event.suffix, event.params);
                }
                else {
                    this.$emit('drop-clicked', event.params);
                }
            }
            else if (event.type == "select") {
                if (event.suffix) {
                    this.$emit('select-clicked-' + event.suffix, event.params);
                }
                else {
                    this.$emit('select-clicked', event.params);
                }
            }
            else if (event.type == "left-select") {
                this.$emit('left-select-clicked', event);
            }
        },
        addClick: function (index) { //emit event when the '+' button is clicked
            this.$emit('add-clicked');
        },
    },
    beforeMount: function () {
        this.rows = this.completeRows;
    }
})

Vue.component('v-select', VueSelect.VueSelect);
