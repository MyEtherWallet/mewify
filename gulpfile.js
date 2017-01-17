/* Global */
var fs           = require('fs')

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

var src          = './src/'
var dst          = './app/'

/* Errors */
function onError(error) {
    console.log(error);
    notify.onError({
        title:    "Gulp",
        subtitle: "Failure!",
        message:  "Error: <%= error.message %>",
        icon:     src + "images/icon.png",
        sound:    "Beep"
    })(error);
    this.emit('end');
}

function onSuccess(msg) {
    return {
        message: msg + " Complete! ",
        icon:    src + "images/icon.png",
        onLast: true
    }
}

// styles: Compile and Minify Less / CSS Files
var styles_watchFolder = src  + 'styles/**/*.less'
var styles_srcFile     = src  + 'styles/mewify-master.less'
var styles_destFolder  = dst  + 'css'
var styles_destFile    =        'mewify-master.css'
var styles_destFileMin =        'mewify-master.min.css'

gulp.task( 'styles', function () {
 return gulp.src( styles_srcFile )
     .pipe( plumber          ({ errorHandler: onError                                   }))
     .pipe( sourcemaps.init  (                                                           ))
     .pipe( less             ({ compress: false                                         }))
     .pipe( autoprefixer     ({ browsers: ['last 2 versions', 'iOS > 8'], remove: false }))
     .pipe( rename           (  styles_destFile                                          ))
     .pipe( gulp.dest        (  styles_destFolder                                        ))
     .pipe( cssnano          ({ autoprefixer: false, safe: true                         }))
     .pipe( rename           (  styles_destFileMin                                       ))
     .pipe( sourcemaps.write (  '/maps'                                                  ))
     .pipe( gulp.dest        (  styles_destFolder                                        ))
     .pipe( notify           (  onSuccess('Styles')                                      ))
})

/* Concat & Uglify JS */
var nativejs_watchFolder   = src  + 'js-native/**/*.js'
var nativejs_destFolder    = dst  + 'js'
var nativejs_destFile      =        'mewify-native.js'
var nativejs_destFileMin   =        'mewify-native.min.js'

gulp.task('nativejs', function() {
  return gulp.src( js_watchFolder )
    .pipe( plumber          ({ errorHandler: onError }))
    .pipe( sourcemaps.init  (                         ))
    .pipe( gulpConcat       (  nativejs_destFile      ))
    .pipe( gulp.dest        (  nativejs_destFolder    ))
    .pipe( uglify           (                         ))
    .pipe( rename           (  nativejs_destFileMin   ))
    .pipe( sourcemaps.write (  '/maps'                ))
    .pipe( gulp.dest        (  nativejs_destFolder    ))
    .pipe( notify           (  onSuccess('JS' )       ))
});


// js: Browserify
var js_watchFolder = src  + 'js/**/*.js'
var js_srcFile     = src  + 'js/main.js'
var js_destFolder  = dst  + 'js/'
var js_destFile    =        'mewify-master.js'
var js_destFileMin =        'mewify-master.min.js'
var babelOpts      = {
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


// Copy
var imgSrcFolder  = src + 'images/**/*'
var fontSrcFolder = src + 'fonts/**/*'
var htmlFiles     = src + 'index.html'
gulp.task('copy', function() {
 gulp.src ( imgSrcFolder )
     .pipe( gulp.dest( dst + 'images' ))
 gulp.src ( fontSrcFolder )
     .pipe( gulp.dest( dst + 'fonts' ))
 gulp.src ( htmlFiles )
     .pipe( gulp.dest( dst ))
 .pipe( notify ( onSuccess(' Copy ' )))
})




// Watch Tasks
gulp.task('watchJS',       function() { gulp.watch( js_watchFolder,       ['js'      ]) })
gulp.task('watchNativeJS', function() { gulp.watch( nativejs_watchFolder, ['nativejs']) })
gulp.task('watchLess',     function() { gulp.watch( styles_watchFolder,   ['styles'  ]) })
gulp.task('watchHTML',     function() { gulp.watch( htmlFiles,            ['copy'    ]) })
gulp.task('watchImages',   function() { gulp.watch( imgSrcFolder,         ['copy'    ]) })
gulp.task('watchFonts',    function() { gulp.watch( fontSrcFolder,        ['copy'    ]) })

gulp.task('watch',         ['watchJS','watchNativeJS','watchLess','watchHTML','watchImages','watchFonts'])

gulp.task('build',         ['styles','nativejs','js','copy'])

gulp.task('default',       ['build', 'watch'])
