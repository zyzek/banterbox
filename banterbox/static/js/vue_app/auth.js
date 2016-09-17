import Vue from 'vue'
import {router} from './app'
import {store} from './store'


const TOKEN_NAME = 'token_id'

export default {


    authenticate(username, password, remember_me = false) {
        Vue.http.post('/api/auth/', {username, password})

        // On success
            .then(response => {
                    let token = response.data.token;
                    console.log(token, response)

                    this.storeToken(token, remember_me)

                    // Now that we're authenticated, collect profile data
                    this.retrieveProfile()
                },
                // On error
                err => {
                    console.log({err})
                    this.removeToken()
                })
    },

    logout(){
        store.user.authenticated = false
        store.user.email = null
        store.user.first_name = null
        store.user.icon = null
        store.user.id = null
        store.user.last_name = null
        store.user.profile_loaded = false
        store.user.username = null
        this.removeToken()
        router.go('/login')
    },

    retrieveProfile(){
        Vue.http.get('/api/user/current').then(response => {
            store.user.profile_loaded = true
            Object.assign(store.user, response.data)
        }, err => console.log({err_2: err}))
    },

    removeToken(){
        sessionStorage.removeItem(TOKEN_NAME)
        localStorage.removeItem(TOKEN_NAME)
        store.user.authenticated = false;
        this.removeTokenHeader()
        console.log('removing token')
    },

    storeToken(token, remember = false){
        if (remember) {
            localStorage.setItem(TOKEN_NAME, token)
        } else {
            sessionStorage.setItem(TOKEN_NAME, token)
        }
        store.user.authenticated = true;

        this.setTokenHeader(token)
        console.log('storing token')
    },


    getToken() {
        let token = localStorage.getItem(TOKEN_NAME)
        if (!token) {
            token = sessionStorage.getItem(TOKEN_NAME)
        }

        // Todo : ping server to check if token is valid, if not then invalidate everything
        if (token) {
            this.setTokenHeader(token)
            console.log(store)
            store.user.authenticated = true
        }



        return token;
    },

    setTokenHeader(token){
        Vue.http.headers.common['Authorization'] = `Token ${token}`;
    },

    removeTokenHeader(){
        delete Vue.http.headers.common['Authorization'];
    }
}