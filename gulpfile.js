const gulp = require('gulp')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps')


gulp.task('say-hi', () => {
    console.log('yo')
})


const sass_options = {
  errLogToConsole: true,
  outputStyle: 'expanded'
};



gulp.task('scss', () => {
    return gulp.src('banterbox/static/scss/site.scss')
        .pipe(sass())
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('banterbox/static/css'))
})