import Vue from 'vue'
import Router from 'vue-router'
import Resource from 'vue-resource'
import NotFound from './components/NotFound.vue'
import Home from './components/Home.vue'
import Rooms from './components/Rooms.vue'
import App from './components/App.vue'
import Login from './components/Login.vue'
import {store} from './store'

Vue.use(Router)
Vue.use(Resource)

import Auth from './auth'

if (Auth.getToken()) {
    Auth.retrieveProfile()
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

// The routes that do not require authentication
const free_routes = ['/login','/404']
const unauthorized_alert = {message : 'You must be logged in to visit that page', type : 'danger'}

// Check auth before travelling to the next route
router.beforeEach(function (transition) {
  if (free_routes.indexOf(transition.to.path) === -1  && !store.user.authenticated) {

      // Set the alert to unauthorized
      if(store.alerts.alerts.indexOf(unauthorized_alert) === -1){
          let {message,type} = unauthorized_alert
          store.alerts.addAlert({message,type})
      }



    transition.redirect('/login')
  } else {
    transition.next()
  }
})


// Start the app!
router.start(App, '#app')

console.log(router)