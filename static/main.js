var highContrast = false;
var widthFactor;
var heightFactor;
{
    let zeroWidth = executor.getBoundingClientRect().width
    let zeroHeight = executor.getBoundingClientRect().height
    executor.innerHTML = '_';
    let oneWidth = executor.getBoundingClientRect().width;
    let oneHeight = executor.getBoundingClientRect().height;
    widthFactor = (oneWidth - zeroWidth) / 10;
    heightFactor = (oneHeight - zeroHeight) / 10;
}

var cols = 40;
var rows = 24;
var fontSize = 16;
var text = '';
var inputBuffer = '';

updateSize();
updateText();

const uri = 'ws://' + location.host + '/socket';
const ws = new WebSocket(uri);

ws.onopen = function() {
    println("Connected!");
    updateText();
};

ws.onclose = function() {
    println("Disconnected!");
    updateText();
};

ws.onmessage = function(msg) {
    print(msg.data);
    updateText();
};

document.addEventListener('keydown', function(e) {
    let isBackSpace = e.keyCode == 8;
    if (isBackSpace) {
        if (inputBuffer.length > 0) {
            inputBuffer = inputBuffer.slice(0, -1);
        }
        updateText();
        return;
    }
    let isEnter = e.keyCode == 13;
    if (isEnter) {
        ws.send(inputBuffer + "\n");
        println(inputBuffer);
        inputBuffer = "";
        updateText();
        return;
    }
    let isSpace = e.keyCode == 32;
    if (isSpace) {
        e.preventDefault();
    }
    let isNumeric = e.keyCode > 47 && e.keyCode < 58;
    let isAlphabetic = e.keyCode > 64 && e.keyCode < 91;
    let isSymbolic = e.keyCode > 186 && e.keyCode < 222;
    if (isSpace || isNumeric || isAlphabetic || isSymbolic) {
        inputBuffer += e.key;
        updateText();
        return;
    }
});

function swapStyleSheet(sheet) {
    document.getElementById("pagestyle").setAttribute("href", sheet);  
}

function toggleHighContrast() {
    highContrast = !highContrast;
    if (highContrast) {
        swapStyleSheet("contrast.css");
    } else {
        swapStyleSheet("dark.css");
    }
}
