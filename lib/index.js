var midi, data, cmd, channel, type, note, velocity, osc, analyser;

// ---------------------- MIDI CONTROLLER --------------------------------------
if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess({
        sysex: false
    }).then(onMIDISuccess, onMIDIFailure);
} else {
    alert("No MIDI support in your browser.");
}

function onMIDISuccess(midiAccess) {
    // when we get a succesful response, run this code
    midi = midiAccess; // this is our raw MIDI data, inputs, outputs, and sysex status

    var inputs = midi.inputs.values();
    // loop over all available inputs and listen for any MIDI input
    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function
        input.value.onmidimessage = onMIDIMessage;
    }
}

function onMIDIFailure(error) {
    console.log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + error);
}

function onMIDIMessage() {
    data = event.data,
    cmd = data[0] >> 4,
    channel = data[0] & 0xf,
    type = data[0] & 0xf0,
    note = data[1],
    velocity = data[2];
    switch(type){
        case 144: // noteOn message
            noteOn(note, velocity);
            break;
        case 128: // noteOff message
            noteOff(note, velocity);
            break;
    }
}

function noteOn(midiNote, velocity){
  playNote(midiNote, velocity);
}

function noteOff(midiNote){
  stopNote(midiNote);
}

// ----------------------------- SYNTHESIZER --------------------------------------

var Note = require('octavian').Note;
var waveform = "sine";
var frequency, osc;
var context = new AudioContext();
var masterVolume = context.createGain();

masterVolume.connect(context.destination);
var oscilators = {};


function playNote(key, velocity){
  osc = context.createOscillator();
  osc.type = waveform;
  frequency = Note.fromPianoKey(key).frequency;
  osc.frequency.value = frequency;
  oscilators[frequency] = osc;
  osc.connect(masterVolume);
  masterVolume.gain.value = velocityToGain(velocity);
  osc.start(context.currentTime);
  analyser = context.createAnalyser();
  osc.connect(analyser);
  visualize();
}

function stopNote(key){
  frequency = Note.fromPianoKey(key).frequency;
  oscilators[frequency].stop(context.currentTime);
}

function velocityToGain(velocity){
  var gain = velocity / 127;
  if (gain < 0.2) { gain = 0.2; }
  return gain;
}

// --------------- OSCILLOSCOPE -----------------------------------

var canvas = document.getElementById("main-canvas");
var canvasCtx = canvas.getContext("2d");
var WIDTH = canvas.width;
var HEIGHT = canvas.height;

function visualize() {
  analyser.fftSize = 1024;
  var bufferLength = analyser.fftSize;
  var dataArray = new Float32Array(bufferLength);

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

  function draw() {

    requestAnimationFrame(draw);

    analyser.getFloatTimeDomainData(dataArray);

    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();

    var sliceWidth = WIDTH * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {

      var v = dataArray[i] * 200.0;
      var y = HEIGHT/2 + v;

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height/2);
    canvasCtx.stroke();
  }

  draw();
}

// ---------------------- DROPDOWN -----------------------------
var $ = require('jquery');
var dropdowns = document.getElementsByClassName("dropdown-content");

$(".dropbtn").on("click", function(){
  document.getElementById("myDropdown").classList.toggle("show");
});

$("#sine").on("click", function(){
  waveform = "sine";
  setWaveform();
});

$("#triangle").on("click", function(){
  waveform = "triangle";
  setWaveform();
});

$("#sawtooth").on("click", function(){
  waveform = "sawtooth";
  setWaveform();
});

function setWaveform() {
  for (var frequency in oscilators) {
    oscilators[frequency].type = waveform;
  }
}

window.onclick = function(event) {
  if (!event.target.matches('.dropbtn')) {
    for (var i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
  }
};
