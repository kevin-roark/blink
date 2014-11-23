$(function() {

  var gus = document.querySelector('#gus');
  var kev = document.querySelector('#kev');
  var bathroom = document.querySelector('#bathroom');
  var subway = document.querySelector('#subway');
  var babysit = document.querySelector('#babysit');

  var webcamCanvas = document.querySelector('#webcamCanvas');

  var vids = [gus, kev, bathroom, subway, babysit];
  var currentVideoIndex = 0;

  var numMedia = vids.length;
  var mediasReady = 0;

  for (var i = 0; i < vids.length; i++) {
    vids[i].addEventListener('canplaythrough', mediaReady);
  }

  function mediaReady() {
    mediasReady++;
    if (mediasReady == numMedia) {
      start();
    }
  }

  function start(restarting) {
    window.blinkProcessor.onLoad();
    window.blinkProcessor.foundEyesCallback = function() {
      cycleToNextVideo();
    }

    Webcam.attach('#cameraPreview');
    Webcam.on('load', function() {
        setInterval(function() {
          takeSnapshot();
          window.blinkProcessor.processFrame();
        }, 40);
    });

    $(vids[0]).show();

    for (var i = 0; i < vids.length; i++) {
      var vid = vids[i];
      vid.play();
    }

    $('.background').fadeOut(900);
  }

  $('body').keypress(function(event) {
    if (event.which == 32) { // spacebar
      //cycleToNextVideo();
    }
  });

  function cycleToNextVideo() {
    $(vids[currentVideoIndex]).hide();

    currentVideoIndex += 1;
    if (currentVideoIndex >= vids.length) {
      currentVideoIndex = 0;
    }

    $(vids[currentVideoIndex]).show();
  }

  function takeSnapshot() {
    Webcam.snap(function(data_uri) {
      var ctx = webcamCanvas.getContext('2d');
      var img = new Image;
      img.onload = function() {
        ctx.drawImage(img, 0, 0); // Or at whatever offset you like
      };
      img.src = data_uri;
    });
  }

});
