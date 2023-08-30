// try-catch block that tries to access the SpeechRecognition object
// and create a new instance of it.
// If the object is not supported by the browser,
// an error message is logged to the console
try {
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    //window.SpeechRecognition checks if the SpeechRecognition interface is available in the current browser
    var recognition = new SpeechRecognition();
    //instant for speech to text
} catch (e) {
    console.error(e);
    //console.error() method in HTML is used to display an error message on the console
    // it used for testing purpose
    $('.no-browser-support').show();
    $('.app').hide();
}

//below are objects that reference HTML elements
var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';
//empty string that will be used to store the text content of the notes

// Get all notes from previous sessions and display them.
var notes = getAllNotes();
renderNotes(notes);


//Voice Recognition (stt)

recognition.continuous = true;
//continuous is a property of the SpeechRecognition object that
// determines whether or not the recognition should continue processing audio input even if the user is not speaking

// This block is called every time the Speech APi captures a line
recognition.onresult = function(event) {
     // code to handle speech recognition results
    // event is a SpeechRecognitionEvent object
    // It holds all the lines we have captured so far
    // We only need the current one(added to noteContent variable)
    var current = event.resultIndex;
    //transcipt of what was currently said
    var transcript = event.results[current][0].transcript;

    // Add the current transcript to the contents of our Note.
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
    //mobileRepeatBug variable is a workaround for a bug in some mobile browsers where the
    // onresult event is triggered twice with the same transcript.
    if (!mobileRepeatBug) {
        noteContent += transcript;
        noteTextarea.val(noteContent);
    }
};

//onstart is an event handler function that is called when the
// SpeechRecognition object starts listening for speech input.
recognition.onstart = function() {
    instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

//onspeechend is an event handler function that is called when the SpeechRecognition object
//detects that the user has stopped speaking.
recognition.onspeechend = function() {
    instructions.text('You were quiet for a while so voice recognition turned itself off.');
}

recognition.onerror = function(event) {
    if (event.error == 'no-speech') {
        instructions.text('No speech was detected. Try again.');
    };
}



//App buttons and input
$('#start-record-btn').on('click', function(e) {
    if (noteContent.length) {
        noteContent += ' ';
    }
    recognition.start();
});

$('#pause-record-btn').on('click', function(e) {
    recognition.stop();
    instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function() {
    noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
    recognition.stop();

    //if no notes
    if (!noteContent.length) {
        instructions.text('Could not save empty note. Please add a message to your note.');
    } else {
        // Save note to localStorage.
        // The key is the dateTime with seconds, the value is the content of the note.
        saveNote(new Date().toLocaleString(), noteContent);

        // Reset variables and update UI.
        noteContent = '';
        renderNotes(getAllNotes());
        noteTextarea.val('');
        instructions.text('Note saved successfully.');
    }

})


notesList.on('click', function(e) {
    e.preventDefault();
    var target = $(e.target);

    // Listen to the selected note.
    if (target.hasClass('listen-note')) {
        var content = target.closest('.note').find('.content').text();
        readOutLoud(content);
    }

    // Delete note.
    if (target.hasClass('delete-note')) {
        var dateTime = target.siblings('.date').text();
        deleteNote(dateTime);
        target.closest('.note').remove();
    }
});



//Speech Synthesis

function readOutLoud(message) {
    var speech = new SpeechSynthesisUtterance();
    //function creates a new SpeechSynthesisUtterance object,
    // Sets the text and voice attributes.
    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 3;

    window.speechSynthesis.speak(speech);
    //content in speech is spoken out loud
}


// Helper Functions


function renderNotes(notes) {
    var html = '';
    if (notes.length) {
        notes.forEach(function(note) {
            html += `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;
        });
    } else {
        html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
    }
    notesList.html(html);

}


function saveNote(dateTime, content) {
    localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
    var notes = [];
    var key;
    for (var i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);

        if (key.substring(0, 5) == 'note-') {
            notes.push({
                date: key.replace('note-', ''),
                content: localStorage.getItem(localStorage.key(i))
            });
        }
    }
    return notes;
}


function deleteNote(dateTime) {
    localStorage.removeItem('note-' + dateTime);
}

