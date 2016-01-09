var gulp = require('gulp');
var runSequence = require('run-sequence');
var Builder = require('systemjs-builder');
var inlineNg2Template = require('gulp-inline-ng2-template');
var path = require('path');
var sourcemaps = require('gulp-sourcemaps');
var paths = require('../paths');
var fs= require('fs');
var concat = require('gulp-concat');
var gulp = require('gulp');
var sass = require('gulp-sass');
var replace = require('gulp-replace');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

paths.redocBuilt = path.join(paths.output, paths.outputName) + '.js';
gulp.task('build', function (callback) {
  return runSequence(
    'clean',
    'bundleProd',
    callback
  );
});

gulp.task('bundle', ['bundleSfx', 'concatDeps', 'uglify']);
gulp.task('bundleProd', ['bundle', 'uglify']);

gulp.task('inlineTemplates', ['sass'], function() {
  return gulp.src(paths.source, { base: './' })
    .pipe(replace(/'(.*?\.css)'/g, '\'.tmp/$1\''))
    .pipe(inlineNg2Template({ base: '/' }))
    .pipe(gulp.dest(paths.tmp));
});

// produces minimized verstion of sfx bundle
gulp.task('uglify', ['concatDeps'], function() {
  return gulp.src(paths.redocBuilt)
    .pipe(sourcemaps.init())
    .pipe(uglify())
    .pipe(rename(paths.outputName + '.min.js'))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(paths.output));
});

var JS_DEV_DEPS = [
  'node_modules/zone.js/dist/zone-microtask.js',
  'node_modules/reflect-metadata/Reflect.js'
];

gulp.task('sass', function () {
  return gulp.src(paths.scss, { base: './' })
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest(paths.tmp));
});

// concatenate angular2 deps
gulp.task('concatDeps', ['bundleSfx'], function() {
  gulp.src(JS_DEV_DEPS.concat([paths.redocBuilt]))
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(concat(paths.outputName + '.js'))
  .pipe(sourcemaps.write('.'))
  .pipe(gulp.dest(paths.output))
});

gulp.task('bundleSfx', ['inlineTemplates'], function(cb) {
  fs.existsSync('dist') || fs.mkdirSync('dist');
  var builder = new Builder('./', 'system.config.js');
  builder.config({
    separateCSS: true
  });

  builder
    .buildStatic(path.join(paths.tmp, paths.sourceEntryPoint),
      paths.redocBuilt,
      { format:'amd', sourceMaps: true, lowResSourceMaps: true }
    )
    .then(function() {
      cb();
    })
    .catch(function(err) {
      cb(new Error(err));
    });
});
