// Processor to detect blinks based on an approach by Burke et al,
// Medical and Biological Engineering and Computing, Volume 39, Number 3 / May, 2001
// HTML 5 implementation inspired by Paul Rouget's motion tracker work

window.blinkProcessor = {
  loaded: false,
  worker: null,
  inCanvas: null,
  inCtx: null,
  diffCanvas: null,
  diffCtx: null,
  lastFrame: null,
  videoWidth: null,
  videoHeight: null,
  widthScale: 1,
  heightScale: 1,
  leftEye: null,
  rightEye: null,
  kEyeBoxDisarmTime: 250,
  debugging: false,

  onLoad: function() {
    this.inCanvas = document.getElementById("webcamCanvas");
    this.inCtx = this.inCanvas.getContext("2d");
    this.diffCanvas = document.getElementById("diff");
    this.diffCtx = this.diffCanvas.getContext("2d");
    this.videoWidth = this.inCanvas.width / this.widthScale;
    this.videoHeight = this.inCanvas.height / this.heightScale;

    var workerPath = this.debugging? "/js/findeyes.js" : "/blink/js/findeyes.js";
    this.worker = new Worker(workerPath);

    var self = this;
    this.worker.onmessage = function(event) {
      if (event.data.error) {
        //if (event.data.error.code == 3) console.log(event.data.error.message);
      }
      else {
        self.foundEyes(event.data);
      }
    };

    this.loaded = true;
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
      if (newFrame[i] > 15) {
  	    newFrame[i] = 0;
  	  } else {
  		  newFrame[i] = 255;
  	  }
    }

    return newFrame;
  },

  processFrame: function() {
    if (!this.loaded) return;

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

    if (this.foundEyesCallback) {
      this.foundEyesCallback();
    }

    // Disarm
    var self = this;
    setTimeout(function () {
      self.leftEye = null;
      self.rightEye = null;
    }, self.kEyeBoxDisarmTime);
  }
};
