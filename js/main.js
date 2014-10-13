$(function() {

  var gus = document.querySelector('#gus');
  var kev = document.querySelector('#kev');

  var vids = [gus, kev];
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
    $(vids[0]).show();

    for (var i = 0; i < vids.length; i++) {
      var vid = vids[i];
      vid.play();
    }

    setInterval(function() {
      //console.log('gus time: ' + gus.currentTime);
      //console.log('kev time: ' + kev.currentTime);
    }, 500);
  }

  $('body').keypress(function(event) {
    if (event.which == 32) { // spacebar
      cycleToNextVideo();
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

});
