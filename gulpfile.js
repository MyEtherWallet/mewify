/* Global */
var autoprefixer = require('gulp-autoprefixer')
var browserify = require('browserify')
var buffer = require('vinyl-buffer')
var cssnano = require('gulp-cssnano')
var gulp = require('gulp')
var gulpConcat = require('gulp-concat')
var less = require('gulp-less')
var notify = require('gulp-notify')
var plumber = require('gulp-plumber')
var rename = require('gulp-rename')
var source = require('vinyl-source-stream')
var sourcemaps = require('gulp-sourcemaps')
var uglify = require('gulp-uglify')
var NwBuilder = require('nw-builder');

var src = './src/'
var app = './app/'

/* Errors */
function onError(error) {
    console.log(error)
    notify.onError({
        title: "Gulp",
        subtitle: "Failure!",
        message: "Error: <%= error.message %>",
        icon: src + "images/icon.png",
        sound: "Beep"
    })(error)
    this.emit('end')
}

function onSuccess(msg) {
    return {
        message: msg + " Complete! ",
        icon: src + "images/icon.png",
        onLast: true
    }
}

// styles: Compile and Minify Less / CSS Files
var styles_watchFolder = src + 'styles/**/*.less'
var styles_srcFile = src + 'styles/mewify-master.less'
var styles_destFolder = app + 'styles'
var styles_destFile = 'mewify-master.css'
var styles_destFileMin = 'mewify-master.min.css'

gulp.task('styles', function() {
    return gulp.src(styles_srcFile)
        .pipe(plumber({ errorHandler: onError }))
        .pipe(sourcemaps.init())
        .pipe(less({ compress: false }))
        .pipe(autoprefixer({ browsers: ['last 3 versions', 'iOS > 7'], remove: false }))
        .pipe(rename(styles_destFile))
        .pipe(gulp.dest(styles_destFolder))
        .pipe(cssnano({ autoprefixer: false, safe: true }))
        .pipe(rename(styles_destFileMin))
        .pipe(sourcemaps.write('/maps'))
        .pipe(gulp.dest(styles_destFolder))
        .pipe(notify(onSuccess('Styles')))
})

// js: concat native
var jsNative_watchFolder = src + 'scripts-native/**/*.js'
var jsNative_SrcFiles = src + 'scripts-native/*.js'
var jsNative_DestFolder = app + 'js/'
var jsNative_DestFile = 'mewify-native.js'
var jsNative_DestFileMin = 'mewify-native.min.js'

/* Concat & Uglify Native JS */
gulp.task('jsNative', function() {
    return gulp.src(jsNative_SrcFiles)
        .pipe(plumber({ errorHandler: onError }))
        .pipe(sourcemaps.init())
        .pipe(gulpConcat(jsNative_DestFile))
        .pipe(gulp.dest(jsNative_DestFolder))
        .pipe(uglify())
        .pipe(rename(jsNative_DestFileMin))
        .pipe(sourcemaps.write('/maps'))
        .pipe(gulp.dest(jsNative_DestFolder))
        .pipe(notify(onSuccess('Native JS')))
});

// js: Browserify
var js_watchFolder = src + 'scripts/**/*.js'
var js_srcFile = src + 'scripts/main.js'
var js_destFolder = app + 'js/'
var js_destFile = 'mewify-master.js'
var js_destFileMin = 'mewify-master.min.js'
var babelOpts = { presets: ['es2015'], compact: false, global: true }

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
        .pipe(sourcemaps.write('/maps'))
        .pipe(gulp.dest(js_destFolder))
        .pipe(notify(onSuccess('JS')))
}
gulp.task('js', function() {
    var bundler = browserify(js_srcFile)
    bundle_js(bundler)
})


// Copy
var imgSrcFolder = src + 'images/**/*'
var fontSrcFolder = src + 'fonts/**/*'
var htmlFiles = src + '*.html'
gulp.task('copy', function() {
    gulp.src(imgSrcFolder).pipe(gulp.dest(app + 'images'))
    gulp.src(fontSrcFolder).pipe(gulp.dest(app + 'fonts'))
    gulp.src(htmlFiles).pipe(gulp.dest(app))
        .pipe(notify(onSuccess('Copy')))
})

gulp.task('buildApp', function() {
    var nw = new NwBuilder({
        files: ['./**/**', '!./src/**/**', '!./build/**/**'], // use the glob format
        platforms: ['osx64', 'win64', 'linux64'],
        version: '0.21.3',
        buildDir: './build',
        forceDownload: true
    });
    nw.build().then(function() {
        console.error("executables done");
        notify(onSuccess('executables building'));
    }).catch(function(error) {
        console.error(error);
        notify(onError(error));
    });
});


// Watch Tasks
gulp.task('watchJS', function() { gulp.watch(js_watchFolder, ['js']) })
gulp.task('watchjsNative', function() { gulp.watch(jsNative_watchFolder, ['jsNative']) })
gulp.task('watchLess', function() { gulp.watch(styles_watchFolder, ['styles']) })
gulp.task('watchHTML', function() { gulp.watch(htmlFiles, ['copy']) })
gulp.task('watchImages', function() { gulp.watch(imgSrcFolder, ['copy']) })
gulp.task('watchFonts', function() { gulp.watch(fontSrcFolder, ['copy']) })

gulp.task('watch', ['watchJS', 'watchjsNative', 'watchLess', 'watchHTML', 'watchImages', 'watchFonts'])

gulp.task('build', ['js', 'jsNative', 'styles', 'copy'])

gulp.task('default', ['build', 'watch'])
