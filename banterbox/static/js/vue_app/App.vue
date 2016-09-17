<template>

    <div id="content-wrapper">
        <div id="header">
            <div style="color: #eaeae5; padding:5px; font-size:1.6rem">BanterBox</div>
            <ul id="header-links">
                <li v-link-active><a v-link="{ path : '/home'}">Home</a></li>
                <li v-link-active><a v-link="{ path : '/rooms' }">Rooms</a></li>
                <li v-link-active><a v-link="{ path : '/404' }">404</a></li>
            </ul>

            <div>
                <a v-link="{ path : '/login'}"> <i class="fa fa-user"></i> Profile/Login</a>
                <span @click="logout"> <i class="fa fa-sign-out"></i> Logout</span>
            </div>
        </div>

        <div class="container" id="main" :class="{centered : store.state.main_centered}">
            <!--<router-view transition="expand" transition-mode="out-in"></router-view>-->
            <router-view></router-view>
        </div>


        <div id="footer">
            <div style="padding:5px;">
                <div style="font-size: 0.5rem">BanterBoys &trade; &REG; {{ year }}</div>
                <div style="font-size: 0.5rem">By using this site, you agree to give HDs to the creators if you are in a
                    position of marking them.
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" rel="stylesheet/scss">
    $distance: 500px;

    #header {
        z-index: 100;
        width: 100%;
        margin-bottom: 15px;
        background-color: #323e4c;
        display: flex;
        align-items: baseline;
    }

    #content-wrapper {
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    #main {
        width: 100%;
        display: flex;
        flex: 1;

        > div {
            width: 100%;
        }

        &.centered {
            align-items: center;
        }
    }

    #header-links {
        margin: 0;
        list-style: none;

        color: #757f8c;

        a {
            color: inherit;
            text-decoration: inherit;
        }

        li {
            padding: 0px 15px;
            display: inline-block;
        }
    }

    .v-link-active {
        color: white;
    }


</style>

<script>
    import {store} from './store'
    import Auth from './auth'
    export default {
        data: () => {
            return {
                store,
                year: new Date().getFullYear()
            }
        },
        methods : {
            logout : function () {
                Auth.logout()
            }
        },
        computed: {
            centered: function () {
                console.log(this.$route.path)
                return this.$route.path === '/rooms'
            }
        },
    }
</script>