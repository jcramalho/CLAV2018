Vue.component('custom-table-simple', {
    template: `
        <div>
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
                <input class="form-control" v-model="filt" type="text" placeholder="Filtrar"/>
            </div>
            <div class="col-sm-1"  v-if="add">
                <button type="button" class="btn btn-default btn-circle" @click="addClick">
                    <span class="glyphicon glyphicon-plus"/>
                </button>
            </div>
            
            <table :class="classTable">
                <thead>
                    <tr>
                        <th v-for="(item,index) in header" @click="sort(index)" class="sorter" :style="{width: cwidth[index]}">
                            {{ item }} <span class="caret"></span>
                        </th>
                    </tr>
                </thead>
                <tbody name="table">
                    <tr v-for="(row,index) in rowsShow" :key="row[0]" @click="rowClick(index)">
                        <td v-for="item in row" style="max-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ item }}</td>
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
        'completeRows',
        'header',
        'ready',
        'cwidth',
        'add'
    ],
    data: function(){ 
        return{
            "rows": [],
            "rowsShow" : [[]],
            "filt" : '',
            "order" : 0,
            "activePage" : 1,
            "pages" : [0],
            "rowsPerPage": 10,
            "nPages": 1,
        };
    },
    watch: {
        filt: function(){
            this.filter();
        },
        rows: function(){
            this.loadPages();
        },
        rowsPerPage: function(){
            this.loadPages();
        },
        activePage: function(){
            this.loadPages();
            this.prepPage();
        },
    },
    methods: {
        filter: function () { //filter rows according to what is written in the input box
            regex= new RegExp(this.filt,"gi");
                
            this.rows=this.completeRows.filter(function (item) {
                    
                for (var i=0; i<item.length; i++) {
                    if(regex.test(item[i])){
                        return true;
                    }
                }
                return false;
            })
            if(this.rows.length==0){
                this.rows=[["Sem resultados correspondentes..."]];
            }
        },
        sort: function(index) { //sort rows by header[index]
            if(this.order==index){
                this.rows.reverse();
                this.order=-index;
            } else {
                this.rows.sort(function(a,b) {
                    if (typeof a[index] === 'string' || a[index] instanceof String)
                        return a[index].localeCompare(b[index]);
                    else
                        return a[index]-b[index];
                })
                this.order=index;
            }
        },
        rowClick: function(index) { //emit event when a row is clicked 
            this.$emit('row-clicked', this.rowsShow[index]);
        },
        addClick: function(index) { //emit event when the '+' button is clicked
            this.$emit('add-clicked');
        },
        loadPages: function(){ //process page numbers
            var page=this.activePage;
            var ret = [];
            
            var n = Math.ceil(this.rows.length/this.rowsPerPage);         

            this.nPages=n;

            if(n>7){
                if(page<5){
                    ret=[1,2,3,4,5,"...",n];
                }
                else if(page>n-4){
                    ret=[1,"...",n-4,n-3,n-2,n-1,n];
                }
                else{
                    ret=[1,"...",page-1,page,page+1,"...",n];
                }
            }
            else {
                for(var i=1; i<=n; i++) {
                    ret.push(i);
                }
            }

            this.pages=ret;

            if(page>n){
                this.loadPage(n);
            } else {
                this.prepPage();
            }
        },
        loadPage: function(page){ //change active page
            if(page!=this.activePage && page>0 && page<=this.nPages){
                this.activePage=page;
            }
        },
        prepPage: function(){ //process rows to be shown 
            var beggining = (this.activePage-1)*this.rowsPerPage;
            var end = beggining+parseInt(this.rowsPerPage);

            this.rowsShow=this.rows.slice(beggining,end);        
        },
        nextPage: function(){
            this.loadPage(this.activePage+1);
        },
        prevPage: function(){
            this.loadPage(this.activePage-1);
        },
        firstLoad: function(){ //loads info upon first render
            var ret = [];
            
            var n = Math.ceil(this.completeRows.length/this.rowsPerPage);

            for(var i=1; i<=n; i++) {
                ret.push(i);
            }

            this.pages=ret;

            this.rowsShow=this.completeRows.slice(0,this.rowsPerPage);
        },
    },
    beforeMount: function(){
        this.firstLoad();
        this.rows=this.completeRows;
    }
})


Vue.component('row-waterfall', {
    template: `
        <tr>
            <td colspan=4 :class="[root ? 'cascata-row-root' : 'cascata-row']">
                <table :class="tableClass">
                    <tbody name="table">
                        <tr>
                            <td v-if="row.sublevel" 
                                class="cascata-drop"
                            >
                                <label
                                    :for="'toggle'+id"
                                    :class="[drop ? 'glyphicon glyphicon-chevron-down' : 'glyphicon glyphicon-chevron-right']"
                                />
                                <input
                                    :id="'toggle'+id" 
                                    type="checkbox" 
                                    v-model="drop" 
                                    @click="dropClicked"
                                    class="drop-row"
                                /> 
                            </td>
                            <td v-else 
                                class="cascata-drop" 
                            >
                            </td>
                            <td 
                                v-for="(item,index) in row.content"
                                :style="{width: cwidth[index]}"
                                @click="rowClicked"
                            > 
                                {{ item }} 
                            </td>
                        </tr>
                        
                        <row-waterfall v-if="drop && subReady[id]" 
                            v-for="(line,index) in row.sublevel"

                            :id="genId(index)" 
                            :row="line" 
                            :key="index"  
                            :cwidth="cwidth"
                            :sub-ready="subReady"

                            @eventWaterfall="eventPass($event)"

                            :table-class="tableClass+' cascata'"
                        />
                        
                        <tr v-if="drop && !subReady[id]">
                            <td colspan=4> Loading... </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr> 
    `,
    props: ['row', 'tableClass', 'cwidth', 'id', 'subReady', 'root'],
    data: function () {
        return {
            drop: false,
        }
    },
    methods: {
        dropClicked: function () { //emit event when a row is expanded
            var eventContent = {
                type: "drop",
                params: {
                    id: this.id,
                    rowData: this.row.content
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        rowClicked: function () { //emit event when a row is clicked
            var eventContent = {
                type: "row",
                params: {
                    id: this.id,
                    rowData: this.row.content
                }
            };
            this.$emit('eventWaterfall', eventContent);
        },
        genId: function (index) { //generate an ID for the child component
            return this.id + "." + index;
        },
        eventPass: function (event) { //pass up an event from child component
            this.$emit('eventWaterfall', event);
        }
    },
})


Vue.component('custom-table-waterfall', {
    template: `
        <div>
            <div class="col-sm-6" v-if="pagesOn">
                Mostrar 
                <select v-model="rowsPerPage">
                    <option>5</option>
                    <option>10</option>
                    <option>20</option>
                    <option>100</option>
                </select>
                entradas
            </div>
            <div class="col-sm-6" v-if="filterOn">
                <input 
                    class="form-control" 
                    v-model="filt" type="text" 
                    placeholder="Filtrar"
                />
            </div>
            
            <table :class="tableClass">
                <thead>
                    <tr>
                        <th style="width: 4%"></th>
                        <th 
                            v-for="(item,index) in header" 
                            @click="sort(index)" 
                            class="sorter" 
                            :style="{width: cwidth[index]}"
                        >
                            {{ item }} <span class="caret"></span>
                        </th>
                    </tr>
                </thead>
                <tbody name="table">
                    <row-waterfall 
                        v-for="(row,index) in rowsShow"

                        :row="row" 
                        :id="completeRows.indexOf(row)+''" 
                        :key="row.index" 
                        :sub-ready="subReady" 
                        :cwidth="cwidth" 
                        
                        :table-class="tableClass+' cascata'" 
                        root="true" 
                        
                        @eventWaterfall="eventPass($event)"
                    />
                </tbody>
            </table>
            
            <div class="pages" v-if="pagesOn">
                <span class="glyphicon glyphicon-chevron-left page-number" @click="prevPage"></span>
                <span class="page-number btn btn-xs btn-default" v-for="page in pages" :class="{active: page==activePage}" @click="loadPage(page)">\ {{ page }}\ </span>
                <span class="glyphicon glyphicon-chevron-right page-number" @click="nextPage"></span>
            </div>
        </div>
    `,
    props: [
        'cwidth',
        'table-class',
        'url',
        'completeRows',
        'header',
        'ready',
        'subReady',
        'pagesOn',
        'filterOn'
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
        };
    },
    watch: {
        filt: function () {
            this.filter();
        },
        rows: function () {
            this.loadPages();
        },
        rowsPerPage: function () {
            this.loadPages();
        },
        activePage: function () {
            this.prepPage();
        },
    },
    methods: {
        filter: function () { //filter rows according to what is written in the input box
            regex = new RegExp(this.filt, "gi");

            this.rows = this.completeRows.filter(function (item) {

                for (var i = 0; i < item.content.length; i++) {
                    if (regex.test(item.content[i])) {
                        return true;
                    }
                }
                return false;
            })
            console.log("ola");
            if (this.rows.length == 0) {
                this.rows = [{ content: ["Sem resultados correspondentes..."] }];
            }
        },
        sort: function (index) { //sort rows by header[index]
            if (this.order == index) {
                this.rows.reverse();
                this.order = -index;
            } else {
                this.rows.sort(function (a, b) {
                    if (typeof a.content[index] === 'string' || a.content[index] instanceof String)
                        return a.content[index].localeCompare(b.content[index]);
                    else
                        return a.content[index] - b.content[index];
                })
                this.order = index;
            }
        },
        loadPages: function () { //process page numbers 
            var ret = [];

            var n = Math.ceil(this.rows.length / this.rowsPerPage);

            for (var i = 1; i <= n; i++) {
                ret.push(i);
            }

            this.pages = ret;

            if (this.activePage > n) {
                this.loadPage(n);
            } else {
                this.prepPage();
            }
        },
        loadPage: function (page) { //change active page
            if (page != this.activePage && page > 0 && page <= this.pages.length) {
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
        eventPass: function (event) { //process event comming from child component
            if (event.type == "row") {
                this.rowClick(event.params);
            }
            else if (event.type == "drop") {
                this.dropClick(event.params);
            }
        },
        rowClick: function (params) { //emit event when a row is clicked
            this.$emit('row-clicked', params);
        },
        dropClick: function (params) { //emit event when a row is expanded
            this.$emit('drop-clicked', params);
        },
    },
    beforeMount: function () {
        this.firstLoad();
        this.rows = this.completeRows;
    }
})



