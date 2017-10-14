(function () {
  var loadScripts = function (urls, done) {
    if (done == null) {
      done = function () {}
    }
    var i = 0
    var onError = function () {
      done(new Error('Error loading ' + urls[i - 1]))
    }
    var next = function () {
      if (i >= urls.length) {
        done()
      } else {
        var url = urls[i]
        ++i
        var script = document.createElement('script')
        script.addEventListener('load', next)
        script.addEventListener('error', onError)
        script.src = url
        document.body.appendChild(script)
      }
    }
    next()
  }

  var config = JSON.parse(decodeURIComponent(window.location.hash.substr(1)))
  loadScripts(config.files, function (err) {
    if (err != null) {
      console.error(err)
    } else {
      window.mocha.grep(config.test)
      window.mocha.run()
    }
  })
})()
