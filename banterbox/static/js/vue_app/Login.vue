<template>
    <div id="login-view">
        <div class="row">
            <div class="col-xs-12">
                <label>Unikey</label>
                <input type="text" v-model="name">
            </div>

            <div class="col-xs-12">
                <label>Password</label>
                <input type="password" v-model="password">
            </div>

            <div class="col-xs-12">
                <button class="btn btn-success btn-block">SUBMIT</button>
            </div>


        </div>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">
    #login-view {

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
    import {store} from './app'
    export default {
        data: function () {
            return {
                store,
                name: '',
                password: ''
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