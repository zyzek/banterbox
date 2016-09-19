<template>
    <div id="alert-box-container">
        <div id="alert-box">
            <div v-for="alert in store.alerts.alerts"
                 @click="store.alerts.dismissAlert($index)"
                 class="alert-row"
                 :class="alert.type"
                 transition="grow"
            >
                <span class="alert-message">{{ alert.message }} </span> <i v-if="alert.duration" class="fa fa-times"></i>
            </div>
        </div>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">

    .alert-message{
        flex:1;
        text-align: center;
    }

    #alert-box-container {
        position: relative;
        width: 100%;
    }

    #alert-box {
        position: absolute;
        width: 100%;
    }

    .alert-row{
        display:flex;
        justify-content:space-between;
        align-items: center;
        color:white;
        cursor: pointer;

        &:not(:last-of-type){
            border-bottom:1px solid #717171
        }

        &:last-of-type{
            box-shadow: 0 2px 2px 0 #c5c5c5;
        }

        i{
            padding:4px;
        }

        &.warning{
            background-color: #fcad10;
        }

        &.danger{
            background-color: #F00;
        }

        &.success{
            background-color: #17b000;
        }

        &.info{
            background-color: #0089ff;
        }



    }
</style>

<script>
    import {store} from '../store'


    export default {
        data: () => {
            return {
                store
            }
        }
    }
</script>