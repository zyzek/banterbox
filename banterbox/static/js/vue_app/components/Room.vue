<template>
    <div class="row">

        <h3>TODO: Check if user has access, if not then inform them that they have no access(banned/not signed in)</h3>
        <h3>Otherwise, pull in room data from API and render the following</h3>


        <div class="col-xs-12">
            <div class="col-xs-12">
                <div><h1><i class="unit-icon fa  fa-{{ room.icon }}"> </i> {{ room.unit_code }}</h1></div>
                <div style="color:dimgray;"><h3 style="font-weight: 200;">{{ room.unit_name }}</h3></div>
            </div>

            <div class="col-xs-12" style="margin-bottom:20px;">
                <canvas id="canvas" style="width:100%; height:350px; background-color: darkslategray"></canvas>
                <div id="worm-comments">

                </div>
            </div>


            <div class="col-xs-12">
                <div class="row">
                    <div class="col-xs-4">
                        <div class="text-xs-center">
                        <span class="vote-icon-container active-green" id="upvote">
                            <i class="vote-icon fa fa-5x fa-thumbs-o-up"></i>
                        </span>
                        </div>
                        <div class="text-xs-center">
                        <span class="vote-icon-container active-red" id="downvote">
                            <i class="vote-icon fa fa-5x fa-thumbs-o-down"></i>
                        </span>
                        </div>
                    </div>
                    <div class="col-xs-8">

                        <div class="comments-panel" v-for="comment in comments">

                            <div class="comment">
                                <span class="comment-username">{{ comment.username }}</span>
                                <div class="comment-text">{{ comment.text }}</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">

</style>


<script>
    import {store} from '../store'
    export default {
        data: () => {
            return {
                store,
                comments :[],
                room : {}
            }
        }
    }
</script>