<template>
    <div id="login-view">
        <form class="row" @submit.prevent="authenticate">
            <div class="col-xs-12">
                <label>Unikey</label>
                <input type="text" v-model="username">
            </div>

            <div class="col-xs-12">
                <label>Password</label>
                <input type="password" v-model="password">
            </div>

            <div class="col-xs-12" v-if="store.user.profile_loaded" transition="grow">
                <p>Welcome back, <i class="fa fa-{{store.user.icon}}"></i>{{store.user.first_name}} {{store.user.last_name}}</p>
            </div>

            <div class="col-xs-12">
                <button class="btn btn-success btn-block" :disabled="username.length == 0 || password.length == 0">SUBMIT</button>
            </div>


        </form>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">
    #login-view {

        input{
            padding:5px;
        }

        .row {
            font-size: 2rem;
        }

        .row > div {
            display: flex;
            flex-direction: column;
            margin-bottom: 15px;
        }

        button {
            margin-top: 1.5rem;
            font-size: 1.2rem;
        }

        label {
            display: block;
        }
    }
</style>


<script>
    import Vue from 'vue'
    import {store} from './app'
    export default {
        data: function () {
            return {
                store,
                username: '',
                password: '',

            }
        },
        methods: {
            authenticate: function () {
                this.$http.post('/api/auth/', {username: this.username, password: this.password})
                        .then(response => {
                                    console.log(response.data.token, response)
                                    Vue.http.headers.common['Authorization'] = `Token ${response.data.token}`;
                                    this.store.user.authenticated = true;

                                    // Now that we're authenticated, collect profile data
                                    this.$http.get('/api/user/current').then(response => {
                                        this.store.user.profile_loaded = true
                                        Object.assign(this.store.user,response.data)
                                    }, err => console.log({err_2: err}))


                                },
                                err => {
                                    console.log({err})
                                    delete Vue.http.headers.common['Authorization'];
                                    this.store.user.authenticated = false;
                                })
            }
        },
        route: {
            activate: function () {
                this.store.state.main_centered = true;
            },
            deactivate: function () {
                this.store.state.main_centered = false;
            }
        }
    }
</script>