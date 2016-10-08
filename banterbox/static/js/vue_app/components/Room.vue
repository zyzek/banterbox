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
                <canvas v-show="!mute_background" id="canvas" style="width:100%; height:350px; background-color: darkslategray"></canvas>
                <canvas v-show="mute_background" id="muted-canvas" style="width:100%; height:350px; background-color: darkslategray"></canvas>
                <div id="worm-comments">

                </div>
                <div>
                    <h5 style="display:inline-block">Background: </h5>
                    <label><input type="radio" v-model="mute_background" :value="false">Play</label>
                    <label><input type="radio" v-model="mute_background" :value="true">Mute </label>
                    <span style="padding-left:15px;font-size:0.7rem"><i>Note: This option won't be in the final product, unless there's a good reason to add it</i></span>
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

                        <div id="comments-panel">

                            <div class="comment" :id="comment.id" v-for="comment in comments">
                                <span class="comment-hash"><i class="fa fa-{{comment.icon}}">  </i>  @{{ comment.author }}</span> <span class="comment-time">{{comment.date}} - {{comment.time}}</span>
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
    import {store} from '../store'
    import moment from 'moment'
    export default {
        data: () => {
            return {
                store,

                canvas_running: false,
                mute_background:false,
                comments: [],
                unit_code: null,
                unit_icon: null,
                unit_name: null,
                room: {
                    id: null,
                    is_loaded: false
                }
            }
        },
        route: {
            activate() {
                this.room.id = this.$route.params.id.replace(/-/g, '')
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

            // Uhhhhh I got a bit distracted.
            // ...Just a bit


            // Demo an animating canvas.
            // Making sure it cleans up after itself when  page unloads since its technically still in memory


            const canvas = document.getElementById('canvas')
            const context = canvas.getContext('2d')

            let delta = 0
            let old_time = Date.now()


            window.addEventListener('resize', (e) => {
                canvas.width = canvas.parentElement.clientWidth
            })

            canvas.height = 350
            canvas.width = 800


            // Cache that shit
            const textures = (() => {

                const out = [];


                ['💋 ', '💄', '💪', '😂', '👁', '👅', '🍌', '🍆', '🌽','🍗','🎷','💉','💊','💣','🔮','🕎','☪','✝️','🐍','🌚'].map(em => {


                    let can = document.createElement('canvas')
                    let ctx = can.getContext('2d')
                    can.width = can.height = 100
                    ctx.font = '100px Arial'
                    ctx.textBaseline = 'top'
                    ctx.fillText(em, 0, 0)
                    out.push(can)
                })

                return out

            })()

            const uguu = {
                x: 0,
                y: 0,
                speed: 15,
                size: 100,
                is_growing: true,
                rotation: 0,
                texture: null

            }

            function renderUguu() {

                if (this.is_growing) {
                    this.size++
                    if (this.size > 120) {
                        this.is_growing = false
                    }
                } else {
                    this.size--
                    if (this.size < 80) {
                        this.is_growing = true
                    }
                }

                this.x += this.speed * delta
                this.y += this.speed * delta

                if (this.y > canvas.height + 5) {
                    this.y = 0 - this.size
                }

                if (this.x > canvas.width + 5) {
                    this.x = 0 - this.size
                }


                this.rotation += (this.speed * delta) * (Math.PI / 180)

                context.save()
                context.textBaseline = 'top'
                context.translate(this.x + this.size / 2, this.y + this.size / 2)
                context.scale(this.size / 100, this.size / 100)
                context.rotate(this.rotation)
                context.drawImage(this.texture, 0, 0)
                context.restore()
            }

            const uguus = []

            Array.from({length: 200}).map(unused => {
                let a = Object.assign({}, uguu)
                a.render = renderUguu
                a.x = Math.random() * canvas.width
                a.y = Math.random() * canvas.height
                a.size = (Math.random() * 100) + 50
                a.speed = Math.random() * 25
                a.rotation = Math.random() * 360 * (Math.PI / 180)
                a.texture = textures[Math.floor(Math.random() * textures.length)]

                uguus.push(a)
            })

            const  run = () => {
                let new_time = Date.now()
                delta = (new_time - old_time) / 100
                old_time = new_time

                // Don't play if muted
                if(!this.mute_background){
                    uguus.map(x => x.render())
                }

                // Stop running
                if(this.canvas_running){
                    requestAnimationFrame(run)
                }
            }

            run()

        }
    }
</script>