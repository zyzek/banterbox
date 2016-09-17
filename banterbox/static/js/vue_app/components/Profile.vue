<template>
    <div id="header-profile">
        <a v-if="!store.user.authenticated" v-link="{ path : '/login'}"> <i class="fa fa-user"> </i>Login</a>
        <div id="header-profile-dropdown" v-if="store.user.authenticated">

            <div @click="toggleDropdown">
                <i class="fa fa-user"> </i> <span>{{ store.user.username }}</span> <i
                    class="fa fa-caret-down"></i>
            </div>
            <div id="header-profile-dropdown-links">
                <div :class="{open : dropdown_open}">
                    <a class="dropdown-menu-item"><i class="fa fa-pencil"></i> Edit Profile</a>
                    <a class="dropdown-menu-item"><i class="fa fa-envelope-o"></i> Messages</a>
                    <a class="dropdown-menu-item" @click.prevent="logout"><i class="fa fa-sign-out"></i> Logout</a>
                </div>
            </div>

        </div>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">
    @import "../../../sass/colours";

    #header-profile-dropdown {

    }

    #header-profile-dropdown-links {
        position: relative;
        color: $header-background;

        .dropdown-menu-item {
            border: 1px solid #a8a8a8;
            border-bottom: none;

            &:last-of-type {
                border-bottom: 1px solid #a8a8a8;
            }

            display: block;

            &:hover {
                color: #ececec;
                background-color: $header-background;

            }
        }

        > div {
            width: 100%;
            max-height: 0;
            overflow: hidden;
            transition: all 0.25s ease-out;
            position: absolute;
            background-color: #ececec;

        }
        .open {
            max-height: 100px;
        }
    }

    #header-profile {
        cursor: pointer;
        margin-right: 10px;
        color: white;

        i {
            padding: 7px;
        }

        a {
            color: inherit;;
            text-decoration: inherit;

            &.v-link-active {
                color: white;
            }
        }
    }
</style>


<script>

    import swal from 'sweetalert2'

    import {store} from '../store'
    import AuthService from '../auth'
    import {router} from '../app'

    export default {
        data: () => {
            return {
                store,
                dropdown_open: false
            }
        }, methods: {
            toggleDropdown(){
                this.dropdown_open = !this.dropdown_open
            },
            logout() {

                swal({
                    title: 'Are you sure?',
                    type: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#17b000',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, log me out'
                }).then(function () {
                    AuthService.logout().then(() => {
                        this.dropdown_open = false
                        store.alerts.addAlert({message: 'Logged out.', duration: 1500})
                        setTimeout(() => router.go('/login'), 250)
                    })
                })
            }
        },
        ready(){
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (!target.closest('#header-profile')) {
                    this.dropdown_open = false
                }
            })
        }
    }
</script>