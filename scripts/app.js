let heading = document.querySelector('h1');
heading.textContent = 'CLICK ANYWHERE TO START'
document.body.addEventListener('click', init);


function init() {
  heading.textContent = 'Tuner';
  document.body.removeEventListener('click', init)

  // Older browsers might not implement mediaDevices at all, so we set an empty object first
  if (navigator.mediaDevices === undefined) {
    navigator.mediaDevices = {};
  }


  // Some browsers partially implement mediaDevices. We can't just assign an object
  // with getUserMedia as it would overwrite existing properties.
  // Here, we will just add the getUserMedia property if it's missing.
  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {

      // First get ahold of the legacy getUserMedia, if present
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }



  // set up forked web audio context, for multiple browsers
  // window. is needed otherwise Safari explodes

  var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  var voiceSelect = document.getElementById("voice");
  var source;
  var stream;

  // grab the mute button to use below

  var mute = document.querySelector('.mute');

  //set up the different audio nodes we will use for the app
  var gainNode = audioCtx.createGain();

  var analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  // grab audio track via XHR for convolver node

  var soundSource;

  // set up canvas context for visualizer

  var canvas = document.querySelector('.visualizer');
  var canvasCtx = canvas.getContext("2d");

  var intendedWidth = document.querySelector('.wrapper').clientWidth;

  canvas.setAttribute('width',intendedWidth);

  var visualSelect = document.getElementById("visual");

  var drawVisual;

  //main block for doing the audio recording

  if (navigator.mediaDevices.getUserMedia) {
     console.log('getUserMedia supported.');
     var constraints = {audio: true}
     navigator.mediaDevices.getUserMedia (constraints)
        .then(
          function(stream) {
             source = audioCtx.createMediaStreamSource(stream);
             gainNode.connect(analyser);
             analyser.connect(audioCtx.destination);

          	 visualize();
        })
        .catch( function(err) { console.log('The following gUM error occured: ' + err);})
  } else {
     console.log('getUserMedia not supported on your browser!');
  }

  function visualize() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

      analyser.fftSize = 256;
      var bufferLengthAlt = analyser.frequencyBinCount;
      console.log(bufferLengthAlt);
      var dataArrayAlt = new Uint8Array(bufferLengthAlt);

      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

      var drawAlt = function() {
        drawVisual = requestAnimationFrame(drawAlt);

        analyser.getByteFrequencyData(dataArrayAlt);

        canvasCtx.fillStyle = 'rgb(0, 0, 0)';
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        var barWidth = (WIDTH / bufferLengthAlt) * 2.5;
        var barHeight;
        var x = 0;

        for(var i = 0; i < bufferLengthAlt; i++) {
          barHeight = dataArrayAlt[i];
          console.log(barHeight);

          canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

          x += barWidth + 1;
        }
      };

      drawAlt();

  }

  mute.onclick = voiceMute;

  function voiceMute() {
    if(mute.id === "") {
      gainNode.gain.value = 0;
      mute.id = "activated";
      mute.innerHTML = "Unmute";
    } else {
      gainNode.gain.value = 1;
      mute.id = "";
      mute.innerHTML = "Mute";
    }
  }
}
