<template>
    <div id="login-view">
        <div class="card" style="padding:20px" v-if="store.demo">
            <p>
                <em>In a real world situation, this would be linked to a university system.</em>
                <br>
                <em>For the purposes of this demo, click to create a user.</em>
            </p>
            <div id="demo-create-user">
                <button class="btn btn-primary" @click="createUser" :disabled="demo.loaded">Generate user</button>
                <div v-if="demo.loaded">
                    <p>Name: <b>{{ demo.username }}</b></p>
                    <p>Password: <b>{{ demo.password }}</b></p>
                </div>
            </div>

        </div>


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
                <input type="checkbox" v-model="remember_me" id="remember-me"> <label for="remember-me">Remember
                me</label>
            </div>

            <div class="col-xs-12 ">
                <div class="col-xs-12" id="login-error" :class="{open : rejected}">
                    Incorrect name or password.
                </div>
            </div>


            <div class="col-xs-12">
                <button class="btn btn-success btn-block" :disabled="username.length == 0 || password.length == 0">
                    SUBMIT
                </button>
            </div>


        </form>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">

    #login-error {
        overflow: hidden;
        max-height: 0px;
        transition: all 0.3s ease;
        color: white;

        &.open {
            padding: 10px;
            background-color: red;
            max-height: 3rem;
        }
    }

    #login-view {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;

        #remember-me {
            margin-right: 10px;;
        }

        input {
            padding: 5px;
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
    import {store} from '../store'
    import {router} from '../app'
    import AuthService from '../auth'

    export default {
        data: function () {
            return {
                store,
                username: '',
                password: '',
                remember_me: true,
                rejected: false,
                demo: {
                    username: null,
                    password: null,
                    loaded: false
                }
            }
        },
        methods: {

            createUser(){
                if (!window.localStorage.getItem('demo_user')) {
                    this.$http.get('/api/demo/get-user')
                            .then(response => {

                                const user = response.data
                                this.demo.loaded = true
                                this.demo.username = user.username
                                this.demo.password = user.password

                                window.localStorage.setItem('demo_user', user.username)
                                window.localStorage.setItem('demo_password', user.password)

                            })
                }
            },

            authenticate(){
                this.rejected = false
                AuthService.authenticate(this.username, this.password, this.remember_me)
                // If auth worked
                        .then(response => {
                            AuthService.retrieveProfile()
                            this.store.alerts.addAlert({
                                message: 'Login successful. Redirecting to room selection',
                                type: 'success',
                                duration: 2000
                            })

                            setTimeout(() => {
                                router.go('/units')
                            }, 1500)
                        })

                        // If auth failed
                        .catch(reject => {
                            if (reject.status === 400) {
                                this.rejected = true
                            }
                            console.log({reject})
                        })

            }
        },
        route: {
            activate: function () {
                // Demo purposes only
                const username = window.localStorage.getItem('demo_user')
                const password = window.localStorage.getItem('demo_password')

                if (username && password) {
                    this.demo.loaded = true
                    this.demo.username = username
                    this.demo.password = password
                } else {
                    window.localStorage.removeItem('demo_user')
                    window.localStorage.removeItem('demo_password')
                }


            },
            deactivate: function () {
            }
        }
    }
</script>