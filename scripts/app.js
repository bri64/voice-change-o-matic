//let heading = document.querySelector('h1');
//heading.textContent = 'CLICK ANYWHERE TO START'
document.body.addEventListener('click', init);

function init() {
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
  var source;
  var stream;

  // grab the mute button to use below

  var mute = document.querySelector('.mute');

  //set up the different audio nodes we will use for the app

  var analyser = audioCtx.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  var gainNode = audioCtx.createGain();

  // set up canvas context for visualizer

  var canvas = document.querySelector('.visualizer');
  var canvasCtx = canvas.getContext("2d");

  var intendedWidth = document.querySelector('.wrapper').clientWidth;

  canvas.setAttribute('width',intendedWidth);

  var drawVisual;

  //main block for doing the audio recording

  if (navigator.mediaDevices.getUserMedia) {
     console.log('getUserMedia supported.');
     var constraints = {audio: true}
     navigator.mediaDevices.getUserMedia (constraints)
        .then(
          function(stream) {
             source = audioCtx.createMediaStreamSource(stream);
             source.connect(gainNode);
             gainNode.connect(analyser);
             analyser.connect(audioCtx.destination);

          	 visualize();
        })
        .catch( function(err) { console.log('The following gUM error occured: ' + err);})
  } else {
     console.log('getUserMedia not supported on your browser!');
  }

  var sampleRate = audioCtx.sampleRate;

  var lastFreq = null;
  var lastFreqCount = 0;

  var freqs = [
    {"name":"C0","value":16.35},
    {"name":"C#0/Db0","value":17.32},
    {"name":"D0","value":18.35},
    {"name":"D#0/Eb0","value":19.45},
    {"name":"E0","value":20.6},
    {"name":"F0","value":21.83},
    {"name":"F#0/Gb0","value":23.12},
    {"name":"G0","value":24.5},
    {"name":"G#0/Ab0","value":25.96},
    {"name":"A0","value":27.5},
    {"name":"A#0/Bb0","value":29.14},
    {"name":"B0","value":30.87},
    {"name":"C1","value":32.7},
    {"name":"C#1/Db1","value":34.65},
    {"name":"D1","value":36.71},
    {"name":"D#1/Eb1","value":38.89},
    {"name":"E1","value":41.2},
    {"name":"F1","value":43.65},
    {"name":"F#1/Gb1","value":46.25},
    {"name":"G1","value":49},
    {"name":"G#1/Ab1","value":51.91},
    {"name":"A1","value":55},
    {"name":"A#1/Bb1","value":58.27},
    {"name":"B1","value":61.74},
    {"name":"C2","value":65.41},
    {"name":"C#2/Db2","value":69.3},
    {"name":"D2","value":73.42},
    {"name":"D#2/Eb2","value":77.78},
    {"name":"E2","value":82.41},
    {"name":"F2","value":87.31},
    {"name":"F#2/Gb2","value":92.5},
    {"name":"G2","value":98},
    {"name":"G#2/Ab2","value":103.83},
    {"name":"A2","value":110},
    {"name":"A#2/Bb2","value":116.54},
    {"name":"B2","value":123.47},
    {"name":"C3","value":130.81},
    {"name":"C#3/Db3","value":138.59},
    {"name":"D3","value":146.83},
    {"name":"D#3/Eb3","value":155.56},
    {"name":"E3","value":164.81},
    {"name":"F3","value":174.61},
    {"name":"F#3/Gb3","value":185},
    {"name":"G3","value":196},
    {"name":"G#3/Ab3","value":207.65},
    {"name":"A3","value":220},
    {"name":"A#3/Bb3","value":233.08},
    {"name":"B3","value":246.94},
    {"name":"C4","value":261.63},
    {"name":"C#4/Db4","value":277.18},
    {"name":"D4","value":293.66},
    {"name":"D#4/Eb4","value":311.13},
    {"name":"E4","value":329.63},
    {"name":"F4","value":349.23},
    {"name":"F#4/Gb4","value":369.99},
    {"name":"G4","value":392},
    {"name":"G#4/Ab4","value":415.3},
    {"name":"A4","value":440},
    {"name":"A#4/Bb4","value":466.16},
    {"name":"B4","value":493.88},
    {"name":"C5","value":523.25},
    {"name":"C#5/Db5","value":554.37},
    {"name":"D5","value":587.33},
    {"name":"D#5/Eb5","value":622.25},
    {"name":"E5","value":659.25},
    {"name":"F5","value":698.46},
    {"name":"F#5/Gb5","value":739.99},
    {"name":"G5","value":783.99},
    {"name":"G#5/Ab5","value":830.61},
    {"name":"A5","value":880},
    {"name":"A#5/Bb5","value":932.33},
    {"name":"B5","value":987.77},
    {"name":"C6","value":1046.5},
    {"name":"C#6/Db6","value":1108.73},
    {"name":"D6","value":1174.66},
    {"name":"D#6/Eb6","value":1244.51},
    {"name":"E6","value":1318.51},
    {"name":"F6","value":1396.91},
    {"name":"F#6/Gb6","value":1479.98},
    {"name":"G6","value":1567.98},
    {"name":"G#6/Ab6","value":1661.22},
    {"name":"A6","value":1760},
    {"name":"A#6/Bb6","value":1864.66},
    {"name":"B6","value":1975.53},
    {"name":"C7","value":2093},
    {"name":"C#7/Db7","value":2217.46},
    {"name":"D7","value":2349.32},
    {"name":"D#7/Eb7","value":2489.02},
    {"name":"E7","value":2637.02},
    {"name":"F7","value":2793.83},
    {"name":"F#7/Gb7","value":2959.96},
    {"name":"G7","value":3135.96},
    {"name":"G#7/Ab7","value":3322.44},
    {"name":"A7","value":3520},
    {"name":"A#7/Bb7","value":3729.31},
    {"name":"B7","value":3951.07},
    {"name":"C8","value":4186.01},
    {"name":"C#8/Db8","value":4434.92},
    {"name":"D8","value":4698.63},
    {"name":"D#8/Eb8","value":4978.03},
    {"name":"E8","value":5274.04},
    {"name":"F8","value":5587.65},
    {"name":"F#8/Gb8","value":5919.91},
    {"name":"G8","value":6271.93},
    {"name":"G#8/Ab8","value":6644.88},
    {"name":"A8","value":7040},
    {"name":"A#8/Bb8","value":7458.62},
    {"name":"B8","value":7902.13}
  ];

  function getClosest(guess) {
    for (let i = 0; i < freqs.length; i++) {
      if (freqs[i].value < guess) { continue; }
      let lastFreq = freqs[i - 1];
      return (guess - lastFreq.value < freqs[i].value - guess) ? lastFreq.name : freqs[i].name;
    }
    return freqs[freqs.length - 1].name;
  }

  function visualize() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

      analyser.fftSize = 8192;
      var bufferLengthAlt = analyser.frequencyBinCount;
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

        let most = null;
        for(var i = 0; i < bufferLengthAlt; i++) {
          barHeight = dataArrayAlt[i];

          if (most == null || barHeight > dataArrayAlt[most]) {
            most = i;
          }

          canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
          canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

          x += barWidth + 1;
        }

        let guess = most * (sampleRate / bufferLengthAlt);
        if (guess !== 0) {
          if (guess === lastFreq) {
            lastFreqCount++;
            if (lastFreqCount === 75) {
              let noteName = getClosest(guess);
              document.querySelector(".note").innerText = noteName;
              console.log(noteName);
            }
          } else {
            lastFreq = guess;
            lastFreqCount = 1;
          }
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
