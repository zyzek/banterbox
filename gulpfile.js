const gulp = require('gulp')
const elixir = require('laravel-elixir')
require('laravel-elixir-vueify');


elixir.config.assetsPath =  __dirname +  '/banterbox/static/'
elixir.config.publicPath =  __dirname + '/banterbox/static/'



elixir(function(mix) {
    mix.sass(['./node_modules/sweetalert2/src/sweetalert2.scss','site.scss', './node_modules/chartist/dist/scss/chartist.scss'])

    mix.browserify('vue_app/app.js')
});



gulp.task('say-hi', () => {
    console.log('yo')
})


const sass_options = {
  errLogToConsole: true,
  outputStyle: 'expanded'
};


//
// gulp.task('sass', () => {
//     return gulp.src('banterbox/static/sass/site.sass')
//         .pipe(sass())
//         .pipe(autoprefixer())
//         .pipe(sourcemaps.write())
//         .pipe(gulp.dest('banterbox/static/css'))
// })