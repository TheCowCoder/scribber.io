const id = (id) => {
    return document.getElementById(id);
}
const cl = (className) => {
    return document.getElementsByClassName(className)[0];
}
const clAll = (className) => {
    return document.getElementsByClassName(className);
}

function http_request(method, url, headers, data, callback) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open(method, url);

    if (method == "POST") {
        for (let header in headers) {
            xmlHttp.setRequestHeader(header, headers[header])
        }
    }
    
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState === 4) {
            callback({status: xmlHttp.status, response: xmlHttp.response});
            // if (xmlHttp.status === 200) {
            //     callback(xmlHttp.response);
            // }
        }
    }

    if (method == "POST") {
        xmlHttp.send(JSON.stringify(data));
    } else {
        xmlHttp.send(null);
    }
}
