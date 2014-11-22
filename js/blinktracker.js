// Processor to detect blinks based on an approach by Burke et al,
// Medical and Biological Engineering and Computing, Volume 39, Number 3 / May, 2001
// HTML 5 implementation inspired by Paul Rouget's motion tracker work

window.blinkProcessor = {
  worker: null,
  inCanvas: null,
  inCtx: null,
  diffCanvas: null,
  diffCtx: null,
  lastFrame: null,
  videoWidth: null,
  videoHeight: null,
  widthScale: 2,
  heightScale: 2,
  leftEye: null,
  rightEye: null,
  kEyeBoxDisarmTime: 1200,

  timerCallback: function() {
	  if (this.video.paused) {
	    return;
	  }

    this.processFrame();

    var self = this;
    setTimeout(function () {
      self.timerCallback();
    }, 0);
  },

  onLoad: function() {
    this.inCanvas = document.getElementById("webcamCanvas");
    this.inCtx = this.inCanvas.getContext("2d");
    this.diffCanvas = document.getElementById("diff");
    this.diffCtx = this.diffCanvas.getContext("2d");
    this.videoWidth = this.inCanvas.width / this.widthScale;
    this.videoHeight = this.inCanvas.height / this.heightScale;
    this.worker = new Worker("/js/findeyes.js");

    var self = this;
    this.worker.onmessage = function(event) {
	    if (event.data[0] == 0) {
  	    self.foundEyes(event.data.slice(1));
  	  }
    };
  },

  getVideoFrame: function() {
    return this.inCtx.getImageData(0, 0, this.videoWidth, this.videoHeight);
  },

  putGreyFrame: function(frame, x, y) {
    var img = this.diffCtx.createImageData(this.videoWidth, this.videoHeight);
    for (var i = 0; i < frame.length; i++) {
      img.data[i * 4 + 3] = 255;
      img.data[i * 4 + 0] = frame[i];
      img.data[i * 4 + 1] = frame[i];
      img.data[i * 4 + 2] = frame[i];
    }
    this.diffCtx.putImageData(img, x, y);
  },

  diffFrame: function(frame1, frame2) {
    var newFrame = new Array(frame1.data.length / 4);
    for (var i = 0; i < newFrame.length; i++) {
      newFrame[i] = (Math.abs(frame1.data[i * 4] - frame2.data[i * 4]) +
                     Math.abs(frame1.data[i * 4 + 1] - frame2.data[i * 4 + 1]) +
                     Math.abs(frame1.data[i * 4 + 2] - frame2.data[i * 4 + 2])) / 3;
      // Threshold and invert
      if (newFrame[i] > 20) {
  	    newFrame[i] = 0;
  	  } else {
  		  newFrame[i] = 255;
  	  }
    }

    return newFrame;
  },

  processFrame: function() {
    var currentFrame = this.getVideoFrame();

    if (this.lastFrame == null) {
      this.lastFrame = currentFrame;
      return;
    }

    // Get the difference frame
    var diffFrame = this.diffFrame(currentFrame, this.lastFrame);
    this.putGreyFrame(diffFrame, 0, 0);
	  this.lastFrame = currentFrame;

    // Locate eyes in worker thread
    var args = {
      frame: diffFrame,
      height: this.videoHeight,
      width: this.videoWidth,
    }

    this.worker.postMessage(args);
  },

  foundEyes: function(result) {
	  if (this.leftEye != null) return;

	  // Store found eye geometry
    this.leftEye = result.leftEye;
    this.rightEye = result.rightEye;

    // Disarm
    var self = this;
    setTimeout(function () {
      self.leftEye = null;
      self.rightEye = null;
    }, self.kEyeBoxDisarmTime);
  }
};
