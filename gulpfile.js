/* Global */
var autoprefixer = require('gulp-autoprefixer');
var cssnano = require('gulp-cssnano');
var gulp = require('gulp');
var gulpConcat = require('gulp-concat');
var less = require('gulp-less');
var notify = require('gulp-notify');
var plumber = require('gulp-plumber');
var rename = require('gulp-rename');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');

/* Errors */
function onError( error ){
  notify.onError( {
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Beep"
  } )( error );
  this.emit('end');
}

/* Compile Less */
gulp.task('less', function() {
  return gulp.src('./src/less/mewify-master.less')
    .pipe(plumber({ errorHandler: onError }))
    .pipe( sourcemaps.init() )
    .pipe(less('compress: false'))
    .pipe( autoprefixer({
       browsers: ['last 3 versions', 'iOS > 7'], remove: false
    } ) )
    .pipe(rename('mewify-master.css'))
    .pipe(gulp.dest('./css'))
    .pipe( cssnano({
      autoprefixer: false,
      safe: true
    } ) )
    .pipe(rename('mewify-master.min.css'))
    .pipe(sourcemaps.write( '../css/maps/' ))
    .pipe(gulp.dest('./css'))
    .pipe(notify('Less Compiled, Prefixed, & Minified'));
});


/* Concat & Uglify JS */
gulp.task('js', function() {
  return gulp.src('./src/js/*.js')
    .pipe(plumber({ errorHandler: onError }))
    .pipe( sourcemaps.init() )
    .pipe(gulpConcat('mewify-master.js'))
    .pipe(gulp.dest('./js'))
    .pipe(uglify())
    .pipe(rename('mewify-master.min.js'))
    .pipe(sourcemaps.write( '../js/maps/' )       )
    .pipe(gulp.dest('./js'))
    .pipe(notify('JS Concatonated & Uglified'))
});

/* Watch Folders */
var lessWatch     = './src/less/**/*.less';
var jsWatch       = './src/js/*.js';

gulp.task('watch', function() {
  gulp.watch(lessWatch, ['less']);
  gulp.watch(jsWatch, ['js']);
});

gulp.task('default', ['less', 'js', 'watch']);
gulp.task('build', ['less', 'js']);
