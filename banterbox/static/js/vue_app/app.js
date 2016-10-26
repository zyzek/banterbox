// Framework libraries
import Vue from 'vue'
import Router from 'vue-router'
import Resource from 'vue-resource'

// Pages
import App from './components/App.vue'
import NotFound from './components/NotFound.vue'
import Home from './components/Home.vue'
import UnitAnalytics from './components/UnitAnalytics.vue'
import RoomSelection from './components/UnitListing.vue'
import Room from './components/Room.vue'
import Login from './components/Login.vue'
import ScheduleSettings from './components/ScheduleSettings.vue'


// App data/logic
import {store} from './store'
Vue.use(Router)
Vue.use(Resource)



import Auth from './auth'

if (Auth.getToken()) {
    Auth.retrieveProfile()
}

export const router = new Router()

router.map({
    '/login': {
        component: Login
    },
    '/units': {
        component: RoomSelection,
    },

    '/units/:id/analytics':{
        component : UnitAnalytics
    },

    '/units/:id': {
        component: Room,
    },
    '/404': {
        component: NotFound
    },
    '/schedule-settings' : {
        component: ScheduleSettings
    }
})

router.redirect({
    '/':'/units',
    '*': '/404'
})

// The routes that do not require authentication
const free_routes = ['/login', '/404']

// Check auth before travelling to the next route
router.beforeEach(function (transition) {
    // if path is safe, continue

    if (free_routes.indexOf(transition.to.path) !== -1) {
        transition.next()
    } else {
        Auth.retrieveProfile().then(success => {
            transition.next()
        }, error => {
            Auth.logout().then(() => {
                // Set the alert to unauthorized
                store.alerts.addAlert({message: 'You must be logged in to visit that page', type: 'danger'})
                transition.redirect('/login')
            })
        })
    }
})


// Start the app!
router.start(App, '#app')

console.log("%c🍆", "background-color:yellow;border:5px solid black;font-size:5rem;color:white;;border-radius:1000px;padding:10px")