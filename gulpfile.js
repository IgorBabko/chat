var $ = require('gulp-load-plugins')();
//var argv = require('yargs').argv;
var gulp = require('gulp');
var livereload = require('gulp-livereload');
//var rimraf = require('rimraf');
var router = require('front-router');
var sequence = require('run-sequence');
var sass = require('gulp-sass');
var jade = require('gulp-jade');

// Cleans the build directory
//gulp.task('clean', function (cb) {
//    rimraf('./build', cb);
//});

// Copies everything in the client folder except templates, Sass, and JS
//gulp.task('copy', function () {
//    return gulp.src(paths.assets, {
//            base: './client/'
//        })
//        .pipe(gulp.dest('./build'))
//        .pipe(livereload());
//});

gulp.task('sass', function () {
    return gulp.src('client/assets/sass/*')
        .pipe(sass()/*.on('error', sass.logError)*/)
        .pipe(gulp.dest('build/assets/css/'))
        .pipe(livereload());
});

gulp.task('jade', function () {
    return gulp.src('client/*.jade')
        .pipe(jade())
        .pipe(gulp.dest('./build/'))
        .pipe(livereload());
});

gulp.task('concatJS', function () {
    return gulp.src('client/assets/js/*')
        //.pipe(uglify)
        //.pipe($.concat('app.js'))
        .pipe(gulp.dest('build/assets/js'));
});

// Builds your entire app once, without starting a server
gulp.task('build', function (cb) {
    sequence(['jade', 'sass', 'concatJS'], cb);
});

// Default task: builds your app and recompiles assets when they change
gulp.task('default', ['build'], function () {

    // Start LiveReload server
    livereload.listen();

    // Watch Sass
    gulp.watch(['client/assets/sass/**/*'], ['sass']);

    // Watch Jade
    gulp.watch(['client/index.jade'], ['jade']);

    // Concat JavaScript files
    gulp.watch(['client/assets/js/**/*'], ['concatJS']);

    // Watch static files
    //gulp.watch(['./client/**/*.*'], ['copy']);
});
