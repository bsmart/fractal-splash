'use strict';

var gulp = require('gulp'),
    $ = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'gulp-*-*', 'gulp.*', 'del', 'browser-sync', 'imagemin-pngquant', 'vinyl-paths', 'colors', 'sassdoc', 'run-sequence'],
        scope: ['dependencies', 'devDependencies', 'peerDependencies'],
        replaceString: /\bgulp[\-.]/,
        lazy: true,
        camelize: true
    }),
    cleanCSS = require('gulp-clean-css'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload;

var bases = {
    app:  'src/',
    dist: 'dist/',
};

var typey = './node_modules/typey/stylesheets';

var icons = {
  fa: 'node_modules/font-awesome/fonts/*'
};

$.colors.setTheme({
  silly:   'rainbow',
  input:   'grey',
  verbose: 'cyan',
  prompt:  'grey',
  info:    'green',
  data:    'grey',
  help:    'cyan',
  warn:    'yellow',
  debug:   'blue',
  error:   'red'
});

var displayError = function(error) {
  // Initial building up of the error
  var errorString = '[' + error.plugin.error.bold + ']';
  errorString += ' ' + error.message.replace("\n",''); // Removes new line at the end

  // If the error contains the filename or line number add it to the string
  if(error.fileName)
      errorString += ' in ' + error.fileName;

  if(error.lineNumber)
      errorString += ' on line ' + error.lineNumber.bold;

  // This will output an error like the following:
  // [gulp-sass] error message in file_name on line 1
  console.error(errorString);
}

var onError = function(err) {
  $.notify.onError({
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Basso"
  })(err);
  this.emit('end');
};

var sassdocOptions = {
   dest: 'docs',
   verbose: true,
   display: {
     access: ['public', 'private'],
     alias: true,
     watermark: true,
   },
   groups: {
     'undefined': 'Ungrouped',
   },
 };

var sassOptions = {
  outputStyle: 'expanded',
  includePaths: [typey]
};

var prefixerOptions = {
  browsers: ['last 2 versions']
};

// BUILD SUBTASKS
// ---------------

gulp.task('clean:dist', function() {
  return gulp.src(bases.dist)
    .pipe($.vinylPaths($.del));
});


gulp.task('styles', function() {
  return gulp.src([bases.app + 'sass/**/*.scss', '!' + bases.app + 'sass/themes/*.scss'])
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions))
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe($.autoprefixer(prefixerOptions))
    .pipe($.rename('styles.css'))
    .pipe(gulp.dest(bases.dist + 'css'))
    .pipe(cleanCSS({debug: true}, function(details) {
      console.log(details.name + ': ' + details.stats.originalSize);
      console.log(details.name + ': ' + details.stats.minifiedSize);
    }))
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe($.rename({ suffix: '.min' }))
    .pipe($.sourcemaps.write('/maps'))
    .pipe(gulp.dest(bases.dist + 'css'))
    .pipe(reload({stream:true}));
});

gulp.task('themes', function() {
  return gulp.src(bases.app + 'scss/themes/*.scss')
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.sourcemaps.init())
    .pipe($.sass(sassOptions))
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe($.autoprefixer(prefixerOptions))
    .pipe(gulp.dest(bases.dist + 'css/themes'))
    .pipe(cleanCSS({debug: true}, function(details) {
      console.log(details.name + ': ' + details.stats.originalSize);
      console.log(details.name + ': ' + details.stats.minifiedSize);
    }))
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe($.rename({ suffix: '.min' }))
    .pipe($.sourcemaps.write('/maps'))
    .pipe(reload({stream:true}))
    .pipe(gulp.dest(bases.dist + 'css/themes'));
});

gulp.task('browser-sync', function() {
  $.browserSync({
    server: {
      baseDir: bases.dist
    }
  });
});

gulp.task('deploy', function() {
  return gulp.src(bases.dist)
    .pipe($.deploy());
});

gulp.task('js-app', function() {
  gulp.src(bases.app + 'js/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe($.concat('app.js'))
    .pipe($.rename({ suffix: '.min' }))
    .pipe($.sourcemaps.write('/maps'))
    .pipe(gulp.dest(bases.dist + 'js'))
    .pipe(reload({stream:true}));
});

gulp.task('js-libs', function() {
  gulp.src([bases.app + 'js/libs/*.js', '!' + bases.app + 'js/libs/modernizr.js'])
    .pipe($.sourcemaps.init())
    .pipe($.uglify())
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe($.concat('libs.js'))
    .pipe($.sourcemaps.write('/maps'))
    .pipe(gulp.dest(bases.dist + 'js'))
    .pipe(reload({stream:true}));
});


gulp.task('copy', function() {

  // copy modernizr to dist directly
  gulp.src(bases.app + 'js/libs/modernizr.js')
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist + 'js/libs'))
    .pipe(reload({stream:true}));

  // copy icons to dist directly
  gulp.src(bases.app + 'icons/**/*.*')
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));

  // copy meta files to dist directly
  gulp.src([bases.app + '*.xml', bases.app + '*.txt'])
    .pipe($.size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));

});

gulp.task('sass-lint', function() {
  gulp.src([bases.app + 'scss/**/*.scss', '!' + bases.app + 'scss/libs/**/*.scss', '!' + bases.app + 'scss/states/_print.scss'])
    .pipe($.sassLint())
    .pipe($.sassLint.format())
    .pipe($.sassLint.failOnError());
});

gulp.task('minify-html', ['styles'], function() {
  gulp.src(bases.app + './*.html')
    .pipe($.inject(gulp.src(bases.dist + 'css/*.min.css', {
        read: false,
    }), {
        ignorePath: 'dist/',
        addRootSlash: false
    }))
    .pipe($.inject(gulp.src(bases.dist + 'js/*.min.js', {
        read: false
    }), {
        ignorePath: 'dist/',
        addRootSlash: false
    }))
    .pipe($.htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));
});

gulp.task('fonts', function() {
  return gulp.src(icons.fa)
    .pipe(gulp.dest(bases.dist + 'fonts'))
})

gulp.task('watch', function() {
  gulp.watch(bases.app + 'sass/**/*.scss', ['styles', 'minify-html', reload]);
  gulp.watch(bases.app + '*.html', ['minify-html', reload]);
  gulp.watch(bases.app + 'img/*', ['imagemin', reload]);
});

gulp.task('retina', function () {
  gulp.src(bases.app + 'img/*@2x.{jpg,png}')
    .pipe($.changed(bases.dist + 'img'))
    .pipe($.unretina())
    .pipe(gulp.dest(bases.dist + 'img'));
});

gulp.task('imagemin', ['retina'], function() {
  return gulp.src(bases.app + 'img/*')
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [$.imageminPngquant()]
    }))
    .pipe(gulp.dest(bases.dist + 'img'));
});

gulp.task('sassdoc', function () {
  var options = {
     dest: bases.dist + 'docs',
     groups: {
       'srts': 'Safe Routes To School',
       'typey': 'Typey',
     },
   };
  return gulp.src([bases.app + 'sass/utilities/*.scss'])
    .pipe($.sassdoc(options));
});

// BUILD TASKS
// ------------

gulp.task('default', function(done) {
  $.runSequence('clean:dist', 'js-app', 'js-libs', 'imagemin', 'fonts', 'styles', 'copy', 'minify-html', 'browser-sync', 'watch', done);
});

gulp.task('build', function(done) {
  $.runSequence('clean:dist', 'js-app', 'js-libs', 'styles', 'fonts', 'imagemin', 'minify-html', 'copy', done);
});
