<template>
    <div class="row">

        <div v-if="!room.is_loaded">
            <h5>
                If you are seeing this, the room's data has not loaded or auth fail, or some other crap.

                Check console and see if something shit itself
            </h5>
        </div>

        <div class="col-xs-12" v-show="room.is_loaded">
            <div class="col-xs-12">
                <div><h1><i class="unit-icon fa  fa-{{ unit_icon }}"> </i> {{ unit_code }}</h1></div>
                <div style="color:dimgray;"><h3 style="font-weight: 200;">{{ unit_name }}</h3></div>
            </div>

            <div class="col-xs-12" style="margin-bottom:20px;">
                <canvas v-show="!mute_background" id="canvas"
                        style="width:100%; height:350px; background-color: darkslategray"></canvas>
                <div id="worm-comments">

                </div>
            </div>


            <div class="col-xs-12">
                <div class="row">
                    <div class="col-xs-4">
                        <div class="text-xs-center">
                        <span class="vote-icon-container" id="upvote">
                            <i @click="changeVote('yes')" class="vote-icon fa fa-5x fa-thumbs-o-up"
                               :class="{green : vote_direction === 'yes'}"></i>
                        </span>
                        </div>
                        <div class="text-xs-center">
                        <span class="vote-icon-container" id="downvote">
                            <i @click="changeVote('no')" class="vote-icon fa fa-5x fa-thumbs-o-down"
                               :class="{red: vote_direction === 'no'}"></i>
                        </span>
                        </div>
                    </div>
                    <div class="col-xs-8">

                        <div id="comments-panel">

                            <div class="comment" :id="comment.id" v-for="comment in comments">
                                <span class="comment-hash"><i class="fa fa-{{comment.icon}}">  </i>  @{{ comment.author }}</span>
                                <span class="comment-time">{{comment.date}} - {{comment.time}}</span>
                                <div class="comment-text">{{ comment.content }}</div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" rel="stylesheet/scss">


    .vote-icon-container {
        display: flex;
        justify-content: center;
        align-items: center;

        .vote-icon {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            border-radius: 1000px;
            width: 100px;
            height: 100px;
            border: 2px solid #b4b4b4;
            margin: 10px;

            transition: all 0.25s ease;

            box-shadow: 0px 2px 0 0 #3b3b3b;

            &:hover {
                box-shadow: 0px 6px 0 0 #3b3b3b;
                transform: translateY(-3px);
            }

            &.red {
                background-color: red;
                border: 2px solid transparent;
            }

            &.green {
                background-color: #23cd23;
                border: 2px solid transparent;
            }

        }
    }

    #comments-panel {
        max-height: 250px;
        overflow-x: hidden;
        overflow-y: scroll;

        .comment {
            background-color: white;
            padding: 5px;
            margin-bottom: 5px;
            border-radius: 2px;
            margin-right: 3px;

            .comment-username {
                font-weight: 600;
            }

            .comment-time {
                font-size: 0.7rem;
            }

            .comment-text {
                padding: 5px;
                font-size: 0.95rem;
            }
        }
    }

</style>


<script>
    import auth from '../auth'
    import {store} from '../store'
    import moment from 'moment'
    import io from 'socket.io-client'
    export default {
        data: () => {
            return {
                store,
                socket: null,
                canvas_running: false,
                worm: null,
                comments: [],
                vote_data: [],
                vote_direction: 0,
                unit_code: null,
                unit_icon: null,
                unit_name: null,
                room: {
                    id: null,
                    is_loaded: false
                }
            }
        },
        methods: {


            initSocket(){
                const room_id = "roomy";
                const socket = io('http://localhost:3000');



                socket.on('unauthorized', function (err) {
                    console.log("There was an error with the authentication:", err.message);
                });

                socket.on('connect',  () => {
                console.log({room: this.room,id: this.room.id})
                    socket.on('authenticated',  (e) => {

                        console.log('authenticated', {e})

                        socket.on('message', data => {
                            console.log({data})
                        })

                        socket.on('data', data => {
                            data.sort((x, y) => {
                                return x.ts - y.ts
                            })

                            // TODO : Fix up this to send to worm all proper
//                            this.vote_data.push(...data)
                        });

                        // Step is a broadcast
                        socket.on('step', (data) => {
//                            console.log(data)
//                            this.vote_data.push(data)
//                            this.worm.addVote(data)
                            this.worm.push_data(100*(data.votes.yes - data.votes.no) , data.ts)
                        });
                        this.socket = socket;
                    });

                    socket.emit('authentication', {token_id: auth.getToken() , room_id: this.room.id });

                });
            },


            changeVote(value){
                if (this.vote_direction === value) {
                    this.vote_direction = 'cancel'
                } else {
                    this.vote_direction = value
                }

                this.socket.emit('vote', {value:this.vote_direction, timestamp:Date.now()})
            }
        },
        route: {
            activate() {
                this.room.id = this.$route.params.id
                this.$http.get(`/api/room/${this.room.id}`)
                        .then(response => {
                            response.data.comments.map(comment => {
                                const _comment = Object.assign({}, comment)
                                _comment.date = moment(comment.timestamp * 1000).format('DD/MM/YYYY')
                                _comment.time = moment(comment.timestamp * 1000).format('HH:mm:ss')
                                this.comments.push(_comment)
                            })
                            this.unit_code = response.data.unit_code
                            this.unit_icon = response.data.unit_icon
                            this.unit_name = response.data.unit_name
                            this.room.is_loaded = true
                            console.log(response)
                        })
                        .catch(error => {
                            console.log(error)
                        })

                this.canvas_running = true
                console.log('starting canvas')

            },
            deactivate () {
                this.canvas_running = false
                console.log('stopping canvas')
            }
        },

        ready(){

            this.initSocket()

            // Dependency on Worm.js to be loaded in the header. When we get closer to launch I will turn this
            // into an ES6 module
            this.worm = new Worm(document.getElementById('canvas'))
        }
    }
</script>