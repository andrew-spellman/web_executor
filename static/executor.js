function print(s) {
    text += s;
}

function println(s) {
    text += s + "\n";
}

function updateText() {
    executor.innerHTML = '';
    let rowIndex = 0;
    let lines = text.split("\n").reverse();
    for (let i = 0; i < lines.length; ++i) {
	    line = lines[i];
	    if (i == 0) {
            line += inputBuffer;
        }
        let partitionCount = Math.ceil(line.length / cols);
        for (let p = partitionCount - 1; p >= 0; --p) {
            if (rowIndex >= rows) {
                return;
            }
            rowIndex += 1;
            executor.prepend(document.createTextNode(line.substring(p * cols, (p + 1) * cols) + "\n"));
        }
    }
}

function updateSize() {
    executor.style.width = fontSize * cols * widthFactor + "px";
    executor.style.height = fontSize * rows * heightFactor + "px";
    executor.style.fontSize = fontSize + "px";
    colText.innerHTML = "columns: " + cols;
    rowText.innerHTML = "rows: " + rows;
    fontSizeText.innerHTML = "font size: " + fontSize + "px";
    colRange.value = cols;
    rowRange.value = rows;
    fontSizeRange.value = fontSize;
    updateText();
}

function setCols(value) {
    cols = parseInt(value);
    updateSize();
}

function setRows(value) {
    rows = parseInt(value);
    updateSize();
}

function setFontSize(value) {
    fontSize = parseInt(value);
    updateSize();
}

function changeCols(value) {
    cols += value;
    updateSize();
}

function changeRows(value) {
    rows += value;
    updateSize();
}

function changeFontSize(value) {
    fontSize += value;
    updateSize();
}
