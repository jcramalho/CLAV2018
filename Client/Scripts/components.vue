Vue.component('custom-table-2', {
    template: '\
        <div>\
            <div class="col-sm-4">\
                Mostrar \
                <select v-model="rowsPerPage">\
                    <option>5</option>\
                    <option>10</option>\
                    <option>20</option>\
                    <option>100</option>\
                </select>\
                entradas\
            </div>\
            <div class="col-sm-7">\
                <input class="form-control" v-model="filt" type="text" placeholder="Filtrar"/>\
            </div>\
            <div class="col-sm-1">\
                <button v-if="add" type="button" class="btn btn-default btn-circle" @click="addClick">\
                    +\
                </button>\
            </div>\
            \
            <table :class="classTable">\
                <thead>\
                    <tr>\
                        <th v-for="(item,index) in header" @click="sort(index)" class="sorter" :style="{width: cwidth[index]}">\
                            {{ item }} <span class="caret"></span>\
                        </th>\
                    </tr>\
                </thead>\
                <tbody name="table">\
                    <tr v-for="(row,index) in rowsShow" :key="row[0]" @click="rowClick(index)">\
                        <td v-for="item in row">{{ item }}</td>\
                    </tr>\
                </tbody>\
            </table>\
            \
            <div class="pages">\
                <span class="glyphicon glyphicon-chevron-left page-number" @click="prevPage"></span>\
                <span class="page-number btn btn-xs btn-default" v-for="page in pages" :class="{active: page==activePage}" @click="loadPage(page)" :disabled="isNaN(page)">\ {{ page }}\ </span>\
                <span class="glyphicon glyphicon-chevron-right page-number" @click="nextPage"></span>\
            </div>\
        </div>\
    ',
    props: ['classTable','completeRows','header','ready','cwidth','add'],
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
        filter: function () {
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
        sort: function(index) {
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
        populate: function(){
            this.rows=this.completeRows;
            this.prepPage();
        },
        rowClick: function(index) {
            this.$emit('row-clicked', this.rowsShow[index]);
        },
        addClick: function(index) {
            this.$emit('add-clicked');
        },
        loadPages: function(){
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
        loadPage: function(page){
            if(page!=this.activePage && page>0 && page<=this.nPages){
                this.activePage=page;
            }
        },
        prepPage: function(){  
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
        firstLoad: function(){
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


