// Virtual console
let consoleDiv = cl("console");
let controlsTop = cl("controls top");
let controlsBottomRight = cl("controls bottom right");
let consoleSpan = cl("console output");


console.log = message => {
    if (typeof message == "object") {
        consoleSpan.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : message) + "<br/>";
    } else {
        consoleSpan.innerHTML += message + "<br/>";
    }
    consoleSpan.lastChild.scrollIntoView();
}

window.onerror = (msg, url, line, col, error) => {
    console.log("!!!! >> ERROR << !!!!");
    console.log(msg);
    console.log(" ---- ");
    console.log("URL: " + url);
    console.log(" ---- ");
    console.log("Line: " + line);
    console.log(" ---- ");
    console.log("Object:")
    console.log(JSON.stringify(error));
    console.log(" ---- ");

}



function move_console(x, y) {
    consoleDiv.style.left = x + "px";
    consoleDiv.style.top = y + "px";
}
move_console(0, 0);
function resize_console(w, h) {
    consoleDiv.style.width = w + "px";
    consoleDiv.style.height = h + "px";
}

controlsTop.onmousedown = e => {
    let startX = consoleDiv.offsetLeft;
    let startY = consoleDiv.offsetTop;

    let startClientX = e.clientX;
    let startClientY = e.clientY;

    document.onmousemove = e => {
        move_console(e.clientX - (startClientX - startX), e.clientY - (startClientY - startY));
    };
    document.onmouseup = e => {
        document.onmousemove = null;
    }
};

controlsBottomRight.onmousedown = e => {
    let startX = consoleDiv.offsetLeft;
    let startY = consoleDiv.offsetTop;

    document.onmousemove = e => {
        resize_console(e.clientX - startX, e.clientY - startY);
    };
    document.onmouseup = e => {
        document.onmousemove = null;
    }

}

document.addEventListener("keypress", e => {
    if (e.key == "0") {
        consoleDiv.classList.toggle("visible");
    }
});