import Vue from 'vue'
import Router from 'vue-router'
import NotFound from './NotFound.vue'
import Home from './Home.vue'
import Rooms from './Rooms.vue'
import App from './App.vue'
import Login from './Login.vue'

Vue.use(Router)


export const store = {
    rooms : {
      hovered : null
    },
    state: {
        main_centered: false,
        units : []
    },
    methodA: () => 1
}
export const router = new Router()

router.map({
    '/home' : {
        component : Home
    },
    '/login' : {
        component : Login
    },
    '/rooms' : {
        component : Rooms
    },
    '/404' : {
        component : NotFound
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