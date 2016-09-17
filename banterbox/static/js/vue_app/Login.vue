<template>
    <div id="login-view">
        <form class="row" @submit.prevent="authenticate">
            <div class="col-xs-12 large-text column-stack">
                <label>Unikey</label>
                <input type="text" v-model="username">
            </div>

            <div class="col-xs-12 large-text column-stack">
                <label>Password</label>
                <input type="password" v-model="password">
            </div>


            <div class="col-xs-12">
                <input type="checkbox" v-model="remember_me" id="remember-me"> <label for="remember-me">Remember me</label>
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

        #remember-me{
            margin-right: 10px;;
        }

        input{
            padding:5px;
        }

        .large-text {
            font-size: 2rem;
        }

        .column-stack {
            display: flex;
            flex-direction: column;
            margin-bottom: 15px;
        }

        button {
            margin-top: 1.5rem;
            font-size: 1.2rem;
        }
    }
</style>


<script>
    import {store} from './app'
    import AuthService from './auth'

    export default {
        data: function () {
            return {
                store,
                username: '',
                password: '',
                remember_me : false
            }
        },
        methods : {
            authenticate(){
                AuthService.authenticate(this.username,this.password,this.remember_me)

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