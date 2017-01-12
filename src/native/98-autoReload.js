var gulp = require('gulp');
gulp.task('reload', function() {
    if (location) location.reload();
});
gulp.watch('./app/js/mewify-master.min.js', ['reload']);
gulp.watch('./app/js/mewify-native.min.js', ['reload']);
