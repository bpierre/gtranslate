var audio = document.getElementById('audio')
self.port.on('play', function(url) {
  audio.src = url
  audio.play()
})
