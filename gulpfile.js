
const {
  src, dest, series, parallel, watch,
} = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const gcmq = require('gulp-group-css-media-queries');
const cleanCSS = require('gulp-clean-css');
const imagemin = require('gulp-imagemin');
const imgCompress = require('imagemin-jpeg-recompress');
const svgSprite = require('gulp-svg-sprite');
const webp = require('gulp-webp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const rename = require('gulp-rename');
const pug = require('gulp-pug');
const gulpif = require('gulp-if');
const newer = require('gulp-newer');
const { argv } = require('yargs');
const browserSync = require('browser-sync').create();
const del = require('del');

sass.compiler = require('node-sass');

const source = 'src';
const build = 'build';

function html(cb) {
  src(`${source}/*.pug`)
    .pipe(pug({
      pretty: true,
    }))
    .pipe(rename({
      extname: '.html',
    }))
    .pipe(dest(build));
  cb();
}

function styles(cb) {
  src([`${source}/**/*.scss`, '!**/*.min.css'])
    .pipe(gulpif(argv.mapped, sourcemaps.init()))
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({
      grid: 'autoplace',
    }))
    .pipe(gulpif(argv.groupMediaQueries, gcmq()))
    .pipe(cleanCSS({
      level: 2,
    }))
    .pipe(rename({
      extname: '.min.css',
    }))
    .pipe(gulpif(argv.mapped, sourcemaps.write('./')))
    .pipe(dest(build));

  src(`${source}/**/*.min.css`)
    .pipe(dest(`${build}`));

  cb();
}

function js(cb) {
  src([`${source}/js/**/*.js`, '!**/*.min.js'])
    .pipe(gulpif(argv.mapped, sourcemaps.init()))
    .pipe(babel({ presets: ['@babel/env'] }))
    .pipe(uglify())
    .pipe(rename({ extname: '.min.js' }))
    .pipe(gulpif(argv.mapped, sourcemaps.write('./')))
    .pipe(dest(`${build}/js`));

  src(`${source}/**/*.min.js`)
    .pipe(dest(build));

  cb();
}

function imgBuild(cb) {
  src([`${source}/img/**/*.*`])
    .pipe(newer(`${build}/img`))
    .pipe(imagemin([
      imgCompress({
        loops: 4,
        min: 80,
        max: 90,
        quality: 'high',
      }),
      imagemin.gifsicle({
        interlaced: true,
        optimizationLevel: 5,
      }),
      imagemin.optipng({ optimizationLevel: 1 }),
      imagemin.svgo({
        plugins: [
          { removeTitle: false },
          { removeDesc: false },
          { removeViewBox: false },
        ],
      }),
    ]))
    .pipe(dest(`${build}/img`));

  if (argv.webp) {
    src(['!**/*.svg', `${source}/img/**/*.*`])
      .pipe(newer(`${build}/img`))
      .pipe(webp({ quality: 80 }))
      .pipe(dest(`${build}/img`));
  }

  cb();
}

function svgSpriteBuild(cb) {
  src(`${source}/icons/**/*.svg`)
    .pipe(newer(`${build}/icons/`))
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          { removeViewBox: false },
          { inlineStyles: false },
          { removeAttrs: { attrs: '(fill|stroke|style)' } },
          { removeStyleElement: true },
        ],
      }),
    ]))
    .pipe(svgSprite({
      mode: {
        symbol: {
          sprite: '../sprite.svg',
        },
      },
    }))
    .pipe(dest(`${build}/icons/`));

  cb();
}

function fonts(cb) {
  src(`${source}/fonts/*.*`)
    .pipe(dest(`${build}/fonts`));

  cb();
}

function server(cb) {
  browserSync.init({
    notify: false,
    server: {
      baseDir: build,
    },
  });
  cb();
}

function watcher(cb) {
  watch(`${source}/**/*.pug`).on('change', series(html, browserSync.reload));
  watch([`${source}/**/*.scss`, `${source}/**/*.css`]).on('change', series(styles, browserSync.reload));
  watch(`${source}/**/*.js`).on('change', series(js, browserSync.reload));
  watch(`${source}/img/`).on('add', series(imgBuild, browserSync.reload));
  watch(`${source}/icons/`).on('add', series(svgSpriteBuild, browserSync.reload));
  watch(`${source}/fonts/**/*.*`).on('add', series(fonts, browserSync.reload));
  cb();
}

function clean() {
  return del(build);
}

exports.clean = clean;

exports.dev = series(clean, imgBuild, svgSpriteBuild, parallel(
  html, styles, js, fonts,
), server, watcher);

exports.build = series(clean, imgBuild, svgSpriteBuild, parallel(
  html, styles, js, fonts,
), server);
