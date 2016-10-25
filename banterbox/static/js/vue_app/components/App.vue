<template>

    <div id="content-wrapper">
        <div id="header">
            <div id="header-main"
                 style="display:flex; justify-content: space-between; align-items: baseline; width:100%; flex-wrap: wrap">
                <div style="display:flex;align-items: baseline">
                    <div style="color: #eaeae5; padding:5px; font-size:1.6rem"><a v-link="{ path : '/units'}">BanterBox</a></div>
                    <ul id="header-links">
                        <li v-link-active id="schedule-settings" v-if="store.user.is_admin"><a v-link="{ path : '/schedule-settings' }">Schedule Settings</a></li>
                        <li v-link-active><a v-link="{ path : '/units' }">Units</a></li>
                    </ul>
                </div>

                <profile></profile>
            </div>
            <alert-box></alert-box>
        </div>

        <div class="container" id="main" :class="{centered : store.ui.main_centered}">
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

                a {
            color: inherit;
            text-decoration: inherit;
        }

    }

    #schedule-settings{
        background-color: red;
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
                return this.$route.path === '/units'
            }
        }
    }
</script>