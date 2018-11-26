var perfil = new Vue({
    el: '#profile',
    data: {
        edit: {
            Level: false,
        },
        newLevel: "",
    },
    methods: {
        checkready: _.debounce(
            function () {
                this.passMessage = "";
                if (!this.edit.Level) {
                    return false;
                }
                else {
                    var ready = true;
                    if (this.edit.Level) {
                        ready = (ready && this.newLevel >= 0 && this.newLevel <= 7);
                    }
                    return ready;
                }
            },
            300
        ),
        update: function () {
            var dataObj = {
                Level: this.newLevel,
                id: window.location.pathname.split('/')[3],
            }

            this.$http.post('/users/updateLevel', dataObj, {
                headers: {
                    'content-type': 'application/json'
                }
            }).then(function (response) {

            }).catch(function (error) {
                console.error(error);
            });
        },
    },
})