const express = require('express')
const path = require('path')

const fixturesMiddlewareFactory = function (config) {
  const app = express()
  app.use('/fixtures', express.static(path.join(__dirname, 'fixtures')))
  return app
}

module.exports = function (config) {
  config.plugins.push({
    'middleware:fixtures': ['factory', fixturesMiddlewareFactory]
  })
  config.set({
    browsers: ['Chrome'],
    frameworks: ['mocha', 'dirty-chai'],
    files: ['test/setup.js', 'test/**/*.spec.js'],
    reporters: ['spec'],
    middleware: ['fixtures']
  })
}
