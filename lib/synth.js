var Note = require('octavian').Note;
var frequency;

function Synth() {
  this.notes = [];
}

Synth.prototype.noteOn = function(key, velocity){
  frequency = Note.fromPianoKey(key);
  console.log("freq " + frequency);
  console.log(velocity);
};
