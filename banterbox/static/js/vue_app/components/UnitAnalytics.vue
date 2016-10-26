<template>
    <div>
        <h1>Analytics for {{ unit_code }}</h1>


        <div class="row">
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


    window.TIMESTAMPS = {"value":[{"votes":{"yes":0,"no":0},"timestamp":1477455747867,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455748865,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455749868,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455750871,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455751876,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455752878,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455753882,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455754888,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455755894,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455756894,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455757895,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455758900,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455759902,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455760917,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455761921,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455762924,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455763930,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455764954,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455765934,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455766938,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455767941,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455768949,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455769951,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455770953,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455771956,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455772959,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455773960,"connected":[]},{"votes":{"yes":0,"no":0},"timestamp":1477455774967,"connected":["112"]},{"votes":{"yes":0,"no":0},"timestamp":1477455775970,"connected":["112","118"]},{"votes":{"yes":1,"no":0},"timestamp":1477455776972,"connected":["112","118"]},{"votes":{"yes":1,"no":0},"timestamp":1477455777973,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455778975,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455779976,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455780978,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455781982,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455782985,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455783991,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455784994,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455785996,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455786998,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455788001,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455789003,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455790010,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455791011,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455792014,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455793016,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455794018,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455795022,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455796030,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455797032,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455798037,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455799043,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455800043,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455801046,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455802047,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455803050,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455804053,"connected":["112","118"]},{"votes":{"yes":2,"no":0},"timestamp":1477455805058,"connected":["112","118"]},{"votes":{"yes":0,"no":3},"timestamp":1477455806061,"connected":["111","112","118"]}]}

    import Chartist from 'chartist'

    import moment from 'moment'
    export default {
        data: () => {
            return {
                unit_code: null
            }
        },
        route: {
            activate(){
                this.unit_code = this.$route.params.id
            }
        },


        ready(){


            const votes = []
            const attendance = []

            let min = Number.MAX_SAFE_INTEGER
            let max = Number.MIN_SAFE_INTEGER



            window.TIMESTAMPS.value.forEach(x => {

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
                  lineSmooth: false,


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
    }
</script>