console.log("Starting background-devtools");

// Background page -- devtools-background.js
chrome.runtime.onConnect.addListener(function (port) {

    var devToolsListener;

    if (port.name !== "devtools-page") {
        return;
    }

    // define listeners...
    devToolsListener = function (message, sender, sendResponse) {
        if (message.action === "checkhttps") {
            checkHttps(port, message);
        }
    };

    // add listeners...
    port.onMessage.addListener(devToolsListener);

    // ...and on disconnect...
    port.onDisconnect.addListener(function () {
        // ...remove listeners
        port.onMessage.removeListener(devToolsListener);
    });

});

function checkHttps(port, message) {
    console.log('message: ',message);
    var success = false;
    $.ajax({
        type: 'GET',
        url: message.url,
        async: false,
        success: function () {
            success = true;
        },
        error: function () {
            success = false;
        }
    });
    port.postMessage({
        action: "newresult",
        url: message.url,
        success: success
    });
}
