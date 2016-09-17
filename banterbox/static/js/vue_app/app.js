import Vue from 'vue'
import Router from 'vue-router'
import Resource from 'vue-resource'
import NotFound from './NotFound.vue'
import Home from './Home.vue'
import Rooms from './Rooms.vue'
import App from './App.vue'
import Login from './Login.vue'
import {store} from './store'

Vue.use(Router)
Vue.use(Resource)

import Auth from './auth'

if (Auth.getToken()) {
    Auth.retrieveProfile()
}

// Vue.http.headers.common['Authorization'] = 'Token ' + localStorage.getItem('id_token');


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

// The routes that do not require authentication
const free_routes = ['/login','/404']

// Check auth before travelling to the next route
router.beforeEach(function (transition) {
  if (free_routes.indexOf(transition.to.path) === -1  && !store.user.authenticated) {
    transition.redirect('/login')
  } else {
    transition.next()
  }
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