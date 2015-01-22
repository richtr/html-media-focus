/**
 * Media Focus API proposal
**/
(function() {

// *** Set up Media Focus API hooks in native JavaScript interfaces

var updateTrackTime = function(evt) {
  var progressRangeEls = document.querySelectorAll(".mediacontrols_progressbar");
  for (var i = 0; i < progressRangeEls.length; i++) {
    if(!progressRangeEls[i]._updateProgressRange) continue;
    progressRangeEls[i]._updateProgressRange();
  }
};

var transferFocus = function(evt) {
  var previousFocusObject = UA.currentFocusObject;

  // Set current focus object
  UA.currentFocusObject = this;

  // Clean-up previously focused object
  if (previousFocusObject !== undefined && previousFocusObject !== UA.currentFocusObject) {
    previousFocusObject.pause();
    previousFocusObject.removeEventListener('timeupdate', updateTrackTime, true);
  }

  UA.currentFocusObject.addEventListener('timeupdate', updateTrackTime, true);

  // Initialize progress range elements in remote controls
  var progressRangeEls = document.querySelectorAll(".mediacontrols_progressbar");
  for (var i = 0; i < progressRangeEls.length; i++) {
    if(!progressRangeEls[i]._initProgressRange) continue;
    progressRangeEls[i]._initProgressRange();
  }
};

var dropFocus = function(evt) {
  var previousFocusObject = UA.currentFocusObject;

  // Set current focus object
  UA.currentFocusObject = undefined;

  // Clean-up previously focused object
  if (previousFocusObject !== undefined) {
    previousFocusObject.removeEventListener('timeupdate', updateTrackTime, true);
  }
};

var setQueued = function (val) {
  var oldValue = this._focusable;
  this._focusable = !!val;

  if (this._focusable === true && oldValue !== true) {
    this.addEventListener('playing', transferFocus, true);
    this.addEventListener('ended', dropFocus, true);
    this.setAttribute('focusable', '');
  } else if (this._focusable === false && oldValue !== false) {
    this.removeEventListener('playing', transferFocus, true);
    this.removeEventListener('ended', dropFocus, true);
    this.removeAttribute('focusable');
  }
};

var getQueued = function(val) {
  return !!this._focusable;
};

// Add focusable to HTMLMediaElement prototype
if (window.HTMLMediaElement !== undefined) {
  Object.defineProperty(
    window.HTMLMediaElement.prototype,
    "focusable",
    {
      set: setQueued,
      get: getQueued
    }
  );
}

// Add focusable to AudioContext prototype
// NOT IMPLEMENTED
/*if (window.AudioContext !== undefined) {
  Object.defineProperty(
    window.AudioContext.prototype,
    "focusable",
    {
      set: setQueued,
      get: getQueued
    }
  );
}*/

// Add focusable to MediaController prototype
if (window.MediaController !== undefined) {
  Object.defineProperty(
    window.MediaController.prototype,
    "focusable",
    {
      set: setQueued,
      get: getQueued
    }
  );
}

// Detect and set up focusable media elements on DOM content load
document.addEventListener('DOMContentLoaded', function() {
  var els = document.querySelectorAll('video,audio');
  for (var i = 0; i < els.length; i++) {
    if (els[i].getAttribute("focusable") !== undefined) {
      els[i].focusable = true;
    }
  }
}, false);

// *** User Agent middleware component to connect focused media object with remote control events

var UA = {

  // Currently focused media object

  currentFocusObject: undefined,

  // Remote Control button logic

  play: function() {
    if (UA.currentFocusObject !== undefined) {
      UA.currentFocusObject.play();
    }
  },

  pause: function() {
    if (UA.currentFocusObject !== undefined) {
      UA.currentFocusObject.pause();
    }
  },

  playpause: function() {
    if (UA.currentFocusObject !== undefined) {
      if (UA.currentFocusObject.paused === false) {
          UA.currentFocusObject.pause();
      } else {
        UA.currentFocusObject.play();
      }
    }
  },

  skipForward: function() {
    // queue and fire a 'next' event toward the currently focused object
    if (UA.currentFocusObject !== undefined) {
        UA.currentFocusObject.dispatchEvent(new Event('next'));
    }
  },

  skipBackward: function() {
    // queue and fire a 'previous' event toward the currently focused object
    if (UA.currentFocusObject !== undefined) {
        UA.currentFocusObject.dispatchEvent(new Event('previous'));
    }
  }

};

// *** Base Remote Control Class
var RemoteControl = function() {};

RemoteControl.prototype = {

  constructor: RemoteControl,

  // UI remote control buttons

  getPlayButton: function() {
    var _playButton = document.createElement('button');
    _playButton.textContent = "Play";
    _playButton.setAttribute('class', 'mediacontrols_playbtn');
    _playButton.addEventListener('click', function() {
      UA.play();
    }, true);
    return _playButton;
  },

  getPauseButton: function() {
    var _pauseButton = document.createElement('button');
    _pauseButton.textContent = "Pause";
    _pauseButton.setAttribute('class', 'mediacontrols_pausebtn');
    _pauseButton.addEventListener('click', function() {
      UA.pause();
    }, true);
    return _pauseButton;
  },

  getPlayPauseButton: function() {
    var _playPauseButton = document.createElement('button');
    _playPauseButton.textContent = "Play / Pause";
    _playPauseButton.setAttribute('class', 'mediacontrols_playpausebtn');
    _playPauseButton.addEventListener('click', function() {
      UA.playpause();
    }, true);
    return _playPauseButton;
  },

  getSkipBackwardButton: function() {
    var _skipBackwardButton = document.createElement('button');
    _skipBackwardButton.textContent = "<<";
    _skipBackwardButton.setAttribute('class', 'mediacontrols_previousbtn');
    _skipBackwardButton.addEventListener('click', function() {
      UA.skipBackward();
    }, true);
    return _skipBackwardButton;
  },

  getSkipForwardButton: function() {
    var _skipForwardButton = document.createElement('button');
    _skipForwardButton.textContent = ">>";
    _skipForwardButton.setAttribute('class', 'mediacontrols_nextbtn');
    _skipForwardButton.addEventListener('click', function() {
      UA.skipForward();
    }, true);
    return _skipForwardButton;
  },

  getProgressBar: function() {
    var _progressRange = document.createElement('input');
    _progressRange.type = "range";
    _progressRange.setAttribute('class', 'mediacontrols_progressbar');
    _progressRange.setAttribute('min', '0');

    // called on current focused object 'playing' events
    _progressRange._initProgressRange = function() {
      if (UA.currentFocusObject !== undefined) {
        var trackDuration = UA.currentFocusObject.duration;
        if (isNaN(trackDuration) || trackDuration === Infinity) {
          _progressRange.value = 0;
          _progressRange.setAttribute('disabled', 'disabled');
        } else {
          _progressRange.setAttribute('max', trackDuration);
          _progressRange.value = UA.currentFocusObject.currentTime;
          _progressRange.removeAttribute('disabled');
        }
      } else {
          _progressRange.value = 0;
          _progressRange.setAttribute('disabled', 'disabled');
      }
    };

    // called on current focused object 'timeupdate' events
    _progressRange._updateProgressRange = function() {
      if (UA.currentFocusObject !== undefined) {
        _progressRange.value = UA.currentFocusObject.currentTime;
      }
    };

    // reflect input changes on to current focused object
    _progressRange.addEventListener('input', function() {
      if (UA.currentFocusObject !== undefined) {
        // Seek current track to requested time
        UA.currentFocusObject.currentTime = _progressRange.value;
      }
    }, true);

    return _progressRange;
  }
};

// *** Individual Remote Control objects

var GenericRemoteControl = function() {
  RemoteControl.call(this);
};
GenericRemoteControl.prototype = Object.create(RemoteControl.prototype) ;
GenericRemoteControl.prototype.constructor = GenericRemoteControl;

var HomeScreenRemoteControl = function() {
  RemoteControl.call(this);
};
HomeScreenRemoteControl.prototype = Object.create(RemoteControl.prototype) ;
HomeScreenRemoteControl.prototype.constructor = HomeScreenRemoteControl;

// Export Remote Controls
window.GenericRemoteControl = GenericRemoteControl;
window.HomeScreenRemoteControl = HomeScreenRemoteControl;

})();