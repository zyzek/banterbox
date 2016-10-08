<template>
    <div>
        <div>
            <div class="row">
                <h3 v-if="store.units.units.length === 0">
                    <i class="fa fa-pulse fa-5x fa-spinner"></i> Loading units...
                </h3>
                <unit-panel :class="{blur: [null,unit.public_id].indexOf(store.rooms.hovered) < 0}"
                            v-for="unit in store.units.units"
                            :unit="unit" ></unit-panel>
            </div>
        </div>

        <div class="row" :class="{blur: !!store.rooms.hovered}">
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
                store
            }
        },
        route: {
            activate: function () {
                this.store.ui.main_centered = true;

                if (store.units.units.length === 0) {
                    this.$http.get('/api/rooms').then(response => {
                        console.log({response})
                        store.units.units.push(...response.data.rooms)
                    }, reject => {

                    })
                }
            },
            deactivate: function () {
                this.store.ui.main_centered = false;

            }
        }
    }
</script>