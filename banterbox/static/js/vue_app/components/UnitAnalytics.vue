<template>
    <div>
        <h1>Analytics for {{ unit_code }}</h1>

        <div class="row">
            <div class="col-xs-12">

                <div class="form-group" v-if="no_rooms_available">
                    <h3>Unfortunately there are no available rooms for this unit. It must be new!</h3>
                </div>

                <div class="form-group">
                    <label class="control-label">Select a room</label>
                        <select type="text" class="form-control" v-model="selected_room.id" @change="getRoomData">
                            <option :value="null">Choose a date from below</option>
                            <option :value="room.id" v-for="room in room_list">{{ room.date }}</option>
                        </select>
                </div>
            </div>
        </div>

        <div class="row" v-show="selected_room.loaded" transition="slide">
            <div class="col-xs-12">
                <div class="info-panel">
                    <div class="panel-description">
                        <h3>Student Satisfaction</h3>
                        <div>In here you will find the overall student satisfaction as well as a timeline to pinpoint
                            the exact moment you broke their hearts.
                        </div>


                        <div class="card" style="padding:10px;">
                            <div id="chart-legend">
                                <h5>Legend:</h5>
                                <div class="legend"><span class="legend-box series-attendance"></span>
                                    Attendance
                                </div>
                                <div class="legend"><span class="legend-box series-votes"></span>
                                    Votes
                                </div>
                            </div>

                            <div id="line-chart">

                            </div>
                        </div>

                    </div>

                    <div class="panel-data">
                    </div>
                </div>

            </div>
            <div class="col-xs-12">
                In this corner, we have attendance stats
            </div>
        </div>


        <div class="row">
            <div class="col-xs-12 col-sm-8">
                In here we have comment sentiments
            </div>

            <div class="col-xs-12 col-sm-4">
                And here, a lovely little word cloud or some shit
            </div>
        </div>


    </div>
</template>


<style lang="scss" rel="stylesheet/scss">

    #chart-legend{
        display:flex;
        font-weight: bold;

        > * {
            padding: 0 5px;
        }
    }


    .legend-box{
        width:20px;
        height:20px;
        display:inline-block;
    }

    .series{
        &-attendance{
            stroke : #d70206;
            background-color: #d70206;
        }

        &-votes{
            stroke : #006fd7;
            background-color: #006fd7;
        }
    }


</style>


<script>

    import Chartist from 'chartist'

    import moment from 'moment'
    export default {
        data: () => {
            return {
                no_rooms_available : false,
                unit_code: null,
                room_list : [],
                selected_room :{
                    id : null,
                    loaded : false,
                    history : []
                }
            }
        },

        methods : {
            getRoomData(){
                if(this.selected_room.id === null){
                    this.selected_room.loaded =  false
                    this.selected_room.history = []
                    return
                }


                this.$http.get(`/api/room/${this.selected_room.id}/analytics`)
                        .then(response => {
                            this.selected_room.loaded = true
                            const parsed = JSON.parse(response.data.history)
                            this.selected_room.history = [...parsed.value]
                            console.log({response})

                            return parsed.value
                        }).then(data => {
                    const interval = parseInt(data.length / 30)
                    this.setupChart(data.filter((val,index) => index % interval == 0))
                })
            },

            setupChart(data){



            const votes = []
            const attendance = []

            let min = Number.MAX_SAFE_INTEGER
            let max = Number.MIN_SAFE_INTEGER



            data.forEach(x => {

                const date = new Date(x.timestamp)
                const vote_value = x.votes.yes - x.votes.no

                attendance.push({x: date, y: x.connected.length})
                votes.push({x: date, y:vote_value})

                min = Math.min(min,vote_value,x.connected.length)
                max = Math.max(max,vote_value,x.connected.length)

            })



            new Chartist.Line('#line-chart', {
                series: [{
                    className : 'series-votes',
                    name : 'Votes',
                    data : votes
                },{
                    className : 'series-attendance',
                    name : 'Attendance',
                    data:attendance
                }]
            }, {
                height: '500px',
                fullWidth: true,
                  showPoint: false,
                  lineSmooth: true,


                chartPadding: {
                    right: 40
                },
                axisX: {
                    type: Chartist.FixedScaleAxis,
                    divisor: 10,
                    labelInterpolationFnc: function (value, index) {
                        console.log(value)
                        return moment(value).format('H:mm:ss')
                    }
                }
            });

            }
        },

        route: {
            activate(){
                this.unit_code = this.$route.params.id


                this.$http.get(`/api/unit/${this.unit_code}/rooms?filter=closed`)
                        .then(response => {
                            const data = response.data
                            console.log({data})
                            this.no_rooms_available = (data.length === 0)
                            this.room_list = [...data]
                        })
            }
        },


        ready(){
        }
    }
</script>