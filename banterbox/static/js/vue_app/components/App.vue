<template>

    <div id="content-wrapper">
        <div id="header">
            <div id="header-main"
                 style="display:flex; justify-content: space-between; align-items: baseline; width:100%; flex-wrap: wrap">
                <div style="display:flex;align-items: baseline">
                    <div style="color: #eaeae5; padding:5px; font-size:1.6rem">BanterBox</div>
                    <ul id="header-links">
                        <li v-link-active><a v-link="{ path : '/home'}">Home</a></li>
                        <li v-link-active><a v-link="{ path : '/rooms' }">Rooms</a></li>
                        <li v-link-active><a v-link="{ path : '/404' }">404</a></li>
                    </ul>
                </div>

                <!-- TODO: PROFILE GOETH HERETH -->
                <profile></profile>
            </div>
            <alert-box></alert-box>
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
    @import "../../../sass/colours";
    $distance: 500px;

    #header {
        z-index: 100;
        width: 100%;
        margin-bottom: 15px;
        background-color: $header-background;
        display: flex;
        align-items: baseline;
        flex-direction: column;
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

        color: $header-link-default;

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
    import {store} from '../store'
    import AuthService from '../auth'
    import {router} from '../app'

    import AlertBox from './AlertBox.vue'
    import Profile from './Profile.vue'


    export default {
        components: {
            'alert-box': AlertBox,
            'profile' : Profile
        },
        data: () => {
            return {
                store,
                year: new Date().getFullYear()
            }
        },
        computed: {
            centered: function () {
                return this.$route.path === '/rooms'
            }
        }
    }
</script>