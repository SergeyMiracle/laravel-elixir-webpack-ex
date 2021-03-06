const gulp = require('gulp')
const path = require('path')
const Elixir = require('laravel-elixir')
const webpack = require('webpack-stream')
const named = require('vinyl-named')
const _ = require('lodash')

let Task = Elixir.Task
let config = Elixir.config
let $ = Elixir.Plugins

Elixir.extend('webpack', function (src, options, output, baseDir) {
  let paths = prepGulpPaths(src, baseDir, output)

  if (_.isPlainObject(src)) {
    let entry = _.mapValues(src, function (script) {
      return './' + path.join(paths.src.baseDir, script)
    })

    // Don't scuff my puma's brah.
    let output = _.assign({
      filename: '[name].js'
    }, options.output)

    options = _.assign({}, options, {
      entry: entry,
      output: output
    })
  }

  new Task('webpack', function () {
    let saveFiles

    if (_.isArray(src)) {
      saveFiles = _.map(paths.src.path, function (file) {
        return path.join(paths.output.baseDir, path.basename(file, path.extname(file)) + '.js')
      })
    } else if (_.isPlainObject(src)) {
      saveFiles = _.map(_.keys(src), function (file) {
        return path.join(paths.output.baseDir, file + '.js')
      })
    } else {
      saveFiles = paths.output
    }

    this.log(paths.src, saveFiles)

    return gulp.src(paths.src.path)
      .pipe(named())
      .pipe(webpack(options))
      .on('error', function (e) {
        (new Elixir.Notification).error(e, 'Webpack Compilation Failed!')

        this.emit('end')
      })
      .pipe(gulp.dest(paths.output.baseDir))
      .pipe(new Elixir.Notification('Webpack Compiled!'))
  })
    .watch(paths.src.baseDir + '/**/*')
})

/**
 * Prep the Gulp src and output paths.
 *
 * @param  {string|array} src
 * @param  {string}       baseDir
 * @param  {string|null}  output
 */
var prepGulpPaths = function (src, baseDir, output) {
  baseDir = baseDir || config.get('assets.js.folder')

  if (_.isObject(src)) {
    src = _.values(src)
  }

  return new Elixir.GulpPaths()
    .src(src, baseDir)
    .output(output || config.get('public.js.outputFolder'), 'app.js')
}
