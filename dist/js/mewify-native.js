var gulp = require('gulp');
gulp.task('reload', function() {
    if (location) location.reload();
});
gulp.watch('./dist/js/mewify-master.min.js', ['reload']);
gulp.watch('./dist/js/mewify-native.min.js', ['reload']);

console.log("hello4");