module.exports = function (config) {
  config.set({
    browsers: ['PhantomJS', 'Chrome', 'Firefox'],
    frameworks: ['mocha', 'dirty-chai'],
    files: [
      {pattern: 'fixtures/**/*', served: true, included: false},
      'test/setup.js',
      'test/**/*.spec.js'
    ],
    reporters: ['spec']
  })
}
