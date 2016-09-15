<template>
    <div @click="changeStatus"
         class="unit-component col-xs-12 col-md-6 col-lg-3 animated"
         :class="{'status-open' : unit.status === 'open'}"
         :id="unit.public_id"
         style="border-radius:3px; padding:5px;display:flex"

    >
        <div class="unit-content-container flex flex-direction-column"
             :class="{'full-height' : unit.status === 'open' ? true : false}"
        >
            <div class="unit-next-day flex flex-children-center" :class="{'move-up' : hovered}" v-if="unit.status !== 'open'">
                <span style="font-size:1.15rem">NEXT SESSION:</span>
                <span style="text-align: center">{{ unit.next_session.day }} {{ unit.next_session.time }}</span>
            </div>
            <div class="unit-content"
                 @mouseenter="onMouseEnter"
                 @mouseleave="onMouseLeave"
            >
                <div>
                    <div class="unit-icon-container" style="text-align: center; margin:15px 0;">
                        <i :class="'fa fa-5x fa-' + unit.icon" class="unit-icon"></i>
                    </div>
                    <p class="unit-code">{{ unit.code }}</p>
                    <p class="unit-name">{{ unit.name }}</p>
                </div>

                <div class="flex flex-direction-column flex-children-center">
                    <span style="font-size:0.75rem;margin-bottom:10px">STATUS : {{ unit.status.toUpperCase() }}</span>
                    <div class="unit-button-border" style="margin-bottom: 15px;">
                        <button class="unit-button">ENTER ROOM</button>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style lang="scss" rel="stylesheet/scss">
    .unit-component{
        /*transition: all 0.25s ease-out;*/
    }

    .move-up{
        transition: all 0.4s  ease;
        transform:translateY(-30px);
    }

    .unit-component {
        z-index: 1;

        &:hover {
            .unit-button {
                background-color: rgba(255, 255, 255, 0.5);
                &:hover {
                    background-color: white;
                }
            }
        }
    }
</style>

<script>
    import {store} from './app'
    export default {
        props: ['unit'],
        data: function () {
            return {
                clicked: false,
                store,
                hovered : false,
            }
        },
        methods: {
            click: function () {
                console.log(this.clicked)
                this.clicked = !this.clicked
                window.location.href = '/room'
            },
            changeStatus: (x, y, z) => {
                console.log({x, y, z})
            },
            onMouseEnter: function () {
                this.hovered = true;
                store.rooms.hovered = this.unit.public_id
            },
            onMouseLeave: function () {
                this.hovered = false;
                store.rooms.hovered = null
            }
        },
    }
</script>