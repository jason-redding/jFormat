var gulp = require('gulp');
var dest = require('gulp-dest');
var include = require('gulp-include');
var uglify = require('gulp-uglify');

gulp.task('default', function() {
	return gulp.src(['src/format.js'])
	.pipe(uglify())
	.pipe(include({
		extensions: 'js'
	}))
	.pipe(gulp.dest('js/min'));
});

gulp.task('build', function() {

});