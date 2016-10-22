<template>


    <div v-if="room_loading"><h3><i class="fa fa-pulse fa-5x fa-spinner"></i> Loading units...</h3></div>


    <div v-if="!room_loading && store.units.units.length === 0">
        <h3><i class="fa fa-exclamation-circle fa-5x"></i> You are not enrolled in any units. If you think this is a problem, please contact your lecturer.</h3>
    </div>


    <div v-if="store.units.units.length > 0">
        <div>
            <div class="row">
                <unit-panel :class="{blur: [null,unit.public_id].indexOf(store.units.hovered) < 0}"
                            v-for="unit in store.units.units"
                            :unit="unit"></unit-panel>
            </div>
        </div>

        <div class="row" :class="{blur: !!store.units.hovered}">
            <div class="col-xs-12" style="font-size: 0.85rem;">
                <div>Here's your classes. This line of text is to make the page look like it knows what
                    it's doing. Ahoy mihoy.
                </div>
                <div>Make lectures great again 2016</div>
            </div>
        </div>
    </div>
</template>


<script>
    import {store} from '../store'
    import UnitPanel from './UnitPanel.vue'

    export default {
        components: {
            'unit-panel': UnitPanel
        },
        data: () => {
            return {
                room_loading: true,
                store
            }
        },
        route: {
            activate: function () {
                this.store.ui.main_centered = true;

                if (store.units.units.length === 0) {
                    this.$http.get('/api/units').then(response => {

                        console.log({response})
                        store.units.units.push(...response.data.units)
                        this.room_loading = false
                    }, reject => {
                        console.log({reject})

                    })
                }else{
                    this.room_loading = false
                }
            },
            deactivate: function () {
                this.store.ui.main_centered = false;

            }
        }
    }
</script>