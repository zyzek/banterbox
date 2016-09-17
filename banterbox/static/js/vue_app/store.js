export const store = {
    user: {
        id: null,
        authenticated: false,
        profile_loaded: false,
        email: null,
        icon: null,
        first_name: null,
        last_name: null,
        username: null,

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