<template>
    <div>
        <div>
            <div class="row">
                <h3 v-if="store.state.units.length === 0">
                    <i class="fa fa-pulse fa-5x fa-spinner"></i> Loading units...
                </h3>
                <unit-panel :class="{blur: [null,unit.public_id].indexOf(store.rooms.hovered) < 0}"
                            v-for="unit in store.state.units"
                            :unit="unit" transition="zoom" stagger="125"></unit-panel>
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
    import {store} from './app'
    import UnitPanel from './UnitPanel.vue'
    import units from './units'

    export default {
        components: {
            'unit-panel': UnitPanel
        },
        data: () => {
            return {
                store
            }
        },
        ready: function () {
            if (store.state.units.length === 0) {
                let [u1,u2,u3,u4] = units
                // We are emulating an ajax call here until the API is ready.
                setTimeout(() => store.state.units.push(u1, u2, u3, u4), 1000)
            }
        },
        route: {
            activate: function () {
                this.store.state.main_centered = true;
                console.log('ACTIVATING ROOMS')
            },
            deactivate: function () {
                this.store.state.main_centered = false;
                console.log('LATER, ROOMS')
            }
        }
    }
</script>