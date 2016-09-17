import Vue from 'vue'
import Router from 'vue-router'
import Resource from 'vue-resource'
import NotFound from './NotFound.vue'
import Home from './Home.vue'
import Rooms from './Rooms.vue'
import App from './App.vue'
import Login from './Login.vue'

Vue.use(Router)
Vue.use(Resource)

import Auth from './auth'

if(Auth.getToken()){
    Auth.retrieveProfile()
}

// Vue.http.headers.common['Authorization'] = 'Token ' + localStorage.getItem('id_token');


export const store = {
    user: {
        authenticated: false,
        profile_loaded: false,
        username: null,
        first_name: null,
        last_name: null,
        get full_name() {
            if (!this.first_name || !this.last_name) {
                return null
            }
            return `${this.first_name} ${this.last_name}`
        }
    },
    rooms: {
        hovered: null
    },
    state: {
        main_centered: false,
        units: []
    },
    methodA: () => 1
}
export const router = new Router()

router.map({
    '/home': {
        component: Home
    },
    '/login': {
        component: Login
    },
    '/rooms': {
        component: Rooms
    },
    '/404': {
        component: NotFound
    }
})

router.redirect({
    '*': '/404'
})


router.start(App, '#app')

Vue.transition('flip', {
    enterClass: 'flipInY',
    leaveClass: 'flipOutY'
})
Vue.transition('zoom', {
    enterClass: 'zoomIn',
    leaveClass: 'zoomOut'
})
Vue.transition('fade', {
    enterClass: 'fadeIn',
    leaveClass: 'fadeOut'
})