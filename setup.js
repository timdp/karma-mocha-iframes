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

  var find = function (arr, pred) {
    for (var i = 0; i < arr.length; ++i) {
      if (pred(arr[i], i, arr)) {
        return arr[i]
      }
    }
    return null
  }

  var endsWith = function (str, suf) {
    return (str.length >= suf.length && str.substr(str.length - suf.length) === suf)
  }

  var runHost = function () {
    var PKG = 'karma-mocha-iframes'

    var port = window.__karma__.port

    var defaultIframeStyles = {
      position: 'absolute',
      left: '0',
      top: '0',
      width: '100%',
      height: '100%',
      border: '0',
      margin: '0',
      padding: '0'
    }

    var defaultRewrites = {}
    var host1 = 'http://localhost:' + port
    var host2 = 'http://127.0.0.1:' + port
    defaultRewrites[host1] = host2
    defaultRewrites[host2] = host1

    var settings = (window.__karma__.client != null)
      ? window.__karma__.client.karmaMochaIframes
      : null
    settings = assign({}, settings, {
      iframeStyles: defaultIframeStyles,
      rewrites: defaultRewrites
    })

    var currentTest, testCallback

    var handleResult = function (error) {
      testCallback(error)
      iframe.src = 'about:blank'
      testCallback = null
      currentTest = null
    }

    var onMessage = function (event) {
      var msg = null
      try {
        msg = JSON.parse(event.data)
      } catch (err) {
        return
      }
      if (msg == null) {
        return
      }
      var data = msg.data
      switch (msg.type) {
        case 'result':
          handleResult(data.error)
          break
        case 'console':
          console[data.level].apply(console, data.args)
          break
      }
    }
    window.addEventListener('message', onMessage, false)

    var iframe = document.createElement('iframe')
    iframe.src = 'about:blank'
    assign(iframe.style, settings.iframeStyles)
    document.body.appendChild(iframe)

    var fileIncluded = function (uri) {
      var dotIdx = uri.lastIndexOf('.')
      if (dotIdx >= 0 && uri.substr(dotIdx + 1) !== 'js') {
        return false
      }
      var parts = uri.split('/')
      var nmIdx = parts.indexOf('node_modules')
      return (nmIdx < 0 || parts[nmIdx + 1] === PKG ||
        parts[nmIdx + 1].substr(0, 6) !== 'karma-')
    }

    var loc = window.location
    var origin = loc.protocol + '//' + loc.host
    if (settings.rewrites[origin] != null) {
      origin = settings.rewrites[origin]
    }

    var files = keys(window.__karma__.files)
    var setupUrl = find(files, function (file) {
      return endsWith(file, '/' + PKG + '/setup.js')
    })
    var baseUri = origin + setupUrl.substr(0, setupUrl.lastIndexOf('/'))

    window.Mocha.Runner.prototype.runTest = function (fn) {
      currentTest = this.test.fullTitle()
      testCallback = fn
      iframe.src = baseUri + '/iframe.html' + '#' + encodeURIComponent(JSON.stringify({
        test: currentTest,
        files: files.filter(fileIncluded),
        karma: {
          config: window.__karma__.config
        }
      }))
    }
  }

  var runGuest = function (config) {
    var send = function (type, data) {
      var msg = JSON.stringify({
        type: type,
        data: data
      })
      window.parent.postMessage(msg, '*')
    }

    var proxyConsole = function (level) {
      var original = console[level]
      if (typeof original !== 'function') {
        return
      }
      console[level] = function () {
        original.apply(console, arguments)
        try {
          var args = Array.apply(null, arguments)
          send('console', {
            level: level,
            args: args
          })
        } catch (err) {}
      }
    }

    var respond = function (test, error) {
      send('result', {
        test: test.fullTitle(),
        error: (error == null) ? null : {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      })
    }

    if (config.karma.config.captureConsole) {
      var levels = keys(console)
      for (var i = 0; i < levels.length; ++i) {
        proxyConsole(levels[i])
      }
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
