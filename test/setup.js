window.expect = window.chai.expect

;(function () {
  var assign = function () {
    var args = Array.apply(null, arguments)
    var result = args.shift()
    for (var i = 0; i < args.length; ++i) {
      var obj = args[i]
      if (obj == null) {
        continue
      }
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = obj[key]
        }
      }
    }
    return result
  }

  var keys = function (obj) {
    var result = []
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        result.push(key)
      }
    }
    return result
  }

  var runHost = function () {
    var IFRAME_STYLES = {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      border: '0',
      margin: '0',
      padding: '0'
    }

    var HOSTNAME_MAP = {
      'localhost': '127.0.0.1',
      '127.0.0.1': 'localhost'
    }

    var currentTest, testCallback

    var handleResult = function (error) {
      testCallback(error)
      iframe.src = 'about:blank'
      testCallback = null
      currentTest = null
    }

    var onMessage = function (event) {
      var result = null
      try {
        result = JSON.parse(event.data)
      } catch (err) {
        return
      }
      if (result != null && result.test === currentTest) {
        handleResult(result.error)
      }
    }
    window.addEventListener('message', onMessage, false)

    var iframe = document.createElement('iframe')
    iframe.src = 'about:blank'
    assign(iframe.style, IFRAME_STYLES)
    document.body.appendChild(iframe)

    var fileIncluded = function (uri) {
      var dotIdx = uri.lastIndexOf('.')
      if (dotIdx >= 0 && uri.substr(dotIdx + 1) !== 'js') {
        return false
      }
      var parts = uri.split('/')
      var nmIdx = parts.indexOf('node_modules')
      return (nmIdx < 0 || parts[nmIdx + 1].substr(0, 6) !== 'karma-')
    }

    var loc = window.location
    var hostname = (loc.protocol === 'http:' && HOSTNAME_MAP.hasOwnProperty(loc.hostname))
      ? HOSTNAME_MAP[loc.hostname]
      : loc.hostname
    var guestHtmlUrl = loc.protocol + '//' + hostname + ':' + loc.port +
      '/base/fixtures/guest.html'

    window.Mocha.Runner.prototype.runTest = function (fn) {
      currentTest = this.test.fullTitle()
      testCallback = fn
      iframe.src = guestHtmlUrl + '#' + encodeURIComponent(JSON.stringify({
        test: currentTest,
        files: keys(window.__karma__.files).filter(fileIncluded)
      }))
    }
  }

  var runGuest = function (config) {
    var respond = function (test, error) {
      var msg = JSON.stringify({
        test: test.fullTitle(),
        error: (error == null) ? null : {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
      window.parent.postMessage(msg, '*')
    }

    window.mocha.setup({
      ui: 'bdd',
      reporter: function (runner) {
        runner.on('pass', respond)
        runner.on('fail', respond)
      }
    })
  }

  var config = null
  try {
    config = JSON.parse(decodeURIComponent(window.location.hash.substr(1)))
  } catch (err) {}

  if (config != null && config.test != null) {
    runGuest(config)
  } else {
    runHost()
  }
})()
