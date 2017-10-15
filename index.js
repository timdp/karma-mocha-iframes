const slash = require('slash')
const path = require('path')

const toPattern = (filename, included) => ({
  pattern: path.resolve(__dirname, filename),
  included: included,
  served: true,
  watched: false
})

const isMocha = (file) => (typeof file === 'object' &&
  slash(file.pattern).endsWith('/node_modules/karma-mocha/lib/adapter.js'))

const framework = function (config) {
  const mochaIndex = config.files.findIndex(isMocha)
  if (mochaIndex >= config.files.length) {
    throw new Error('karma-mocha-iframes: karma-mocha not found')
  }
  config.files.splice(mochaIndex + 1, 0,
    toPattern('setup.js', true),
    toPattern('iframe.html', false)
  )
}

framework.$inject = ['config']

module.exports = {
  'framework:mocha-iframes': ['factory', framework]
}
