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
var browserify = require('browserify')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var babelify = require('babelify')

/* Errors */
function onError(error) {
    console.log(error);
    notify.onError({
        title: "Gulp",
        subtitle: "Failure!",
        message: "Error: <%= error.message %>",
        sound: "Beep"
    })(error);
    this.emit('end');
}

function onSuccess(msg) {
    return {
        message: msg + " Complete! ",
        onLast: true
    }
}

/* Compile Less */
gulp.task('less', function() {
    return gulp.src('./src/less/mewify-master.less')
        .pipe(plumber({ errorHandler: onError }))
        .pipe(sourcemaps.init())
        .pipe(less('compress: false'))
        .pipe(autoprefixer({
            browsers: ['last 3 versions', 'iOS > 7'],
            remove: false
        }))
        .pipe(rename('mewify-master.css'))
        .pipe(gulp.dest('./app/css'))
        .pipe(cssnano({
            autoprefixer: false,
            safe: true
        }))
        .pipe(rename('mewify-master.min.css'))
        .pipe(sourcemaps.write('./maps/'))
        .pipe(gulp.dest('./app/css'))
        .pipe(notify('Less Compiled, Prefixed, & Minified'));
});

// js: concat native
var js_nativeSrcFiles = './src/native/*.js'
var js_nativeDestFolder = './app/js/'
var js_nativeDestFile = 'mewify-native.js'
var js_nativeDestFileMin = 'mewify-native.min.js'

/* Concat & Uglify Native JS */
gulp.task('nativeJS', function() {
    return gulp.src(js_nativeSrcFiles)
        .pipe(plumber({ errorHandler: onError }))
        .pipe(sourcemaps.init())
        .pipe(gulpConcat(js_nativeDestFile))
        .pipe(gulp.dest(js_nativeDestFolder))
        .pipe(uglify())
        .pipe(rename(js_nativeDestFileMin))
        .pipe(sourcemaps.write('./maps/'))
        .pipe(gulp.dest(js_nativeDestFolder))
        .pipe(notify(onSuccess('JS Native Files Concatonated')))
});

// js: Browserify
var js_srcFile = './src/js/main.js'
var js_destFolder = './app/js/'
var js_destFile = 'mewify-master.js'
var js_destFileMin = 'mewify-master.min.js'
var babelOpts = {
    presets: ['es2015'],
    compact: false,
    global: true
}

function bundle_js(bundler) {
    return bundler.bundle()
        .pipe(plumber({ errorHandler: onError }))
        .pipe(source('main.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init())
        .pipe(rename(js_destFile))
        .pipe(gulp.dest(js_destFolder))
        .pipe(uglify())
        .pipe(rename(js_destFileMin))
        .pipe(sourcemaps.write('./maps/'))
        .pipe(gulp.dest(js_destFolder))
        .pipe(notify(onSuccess('JS Concatonated & Uglified')))
}
gulp.task('js', function() {
    var bundler = browserify(js_srcFile)
    bundle_js(bundler)
})

/* Watch Folders */
var less_WatchFolder = './src/less/**/*.less';
var js_watchFolder = './src/js/**/*.js'
var js_nativeWatchFolder = './src/native/*.js'

gulp.task('watch', function() {
    gulp.watch(less_WatchFolder, ['less']);
    gulp.watch(js_watchFolder, ['js']);
    gulp.watch(js_nativeWatchFolder, ['nativeJS']);
});

gulp.task('default', ['less', 'js', 'nativeJS', 'watch']);
gulp.task('build', ['less', 'js', 'nativeJS']);
