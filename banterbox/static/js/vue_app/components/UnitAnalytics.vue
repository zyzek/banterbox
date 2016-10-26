<template>
    <div>
        <h1>Analytics for {{ unit_code }}</h1>


        <div class="row">
            <div class="col-xs-12 col-sm-8">
                <div class="info-panel">
                    <div class="panel-description">
                        <h3>Student Satisfaction</h3>
                        <div>In here you will find the overall student satisfaction as well as a timeline to pinpoint
                            the exact moment you broke their hearts.
                        </div>

                        <div id="line-chart">

                        </div>

                    </div>

                    <div class="panel-data">
                    </div>
                </div>

            </div>
            <div class="col-xs-12 col-sm-4">
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

</style>


<script>
    import Chartist from 'chartist'
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
            new Chartist.Line('#line-chart', {
                labels: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                series: [
                    [12, 9, 7, 8, 5],
                ]
            }, {
                fullWidth: true,
                chartPadding: {
                    right: 40
                }
            });
        }
    }
</script>