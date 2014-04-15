// jshint evil: true
function exportToCsv(collection, filename) {
    var output, i, line, index, downloadLink;

    filename = (typeof filename === 'undefined') ? 'download.csv' : filename;
    output = '';

    for (i = 0; i < collection.length; i++) {
        line = '';
        for (index in collection[i]) {
            if (line !== '') line += ',';
            line += collection[i][index];
        }
        output += line + '\r\n';
    }

    downloadLink = document.createElement('a');
    downloadLink.href = 'data:text/csv;charset=utf-8;base64,' + btoa(output);
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}


$(document).ready(function () {
    var ViewModel,
        viewData,
        loc,
        backgroundPort;

    // Connect to background
    backgroundPort = chrome.runtime.connect({
        name : "devtools-page"
    });

    // listen for messages from the background
    backgroundPort.onMessage.addListener(function (message) {
        //console.log('message recieved: ', message);
        if (message.action === "newresult") {
            viewData.urls.push({
                url: message.url,
                https: (message.success) ? 'Y' : 'N'
            });
        }
    });

    ViewModel = function () {
        this.urls = ko.observableArray([]);
        this.generateReport = function () {
            var data = _.map(this.urls(), function (url) {
                var filtered = {};
                filtered.url = '"' + url.url + '"';
                filtered.https =  '"' + url.https + '"';
                return filtered;
            });
            data.unshift({
                url: '"URL"',
                https: '"HTTPS Support"'
            });
            exportToCsv(data, 'https-support.csv');
        };
    };

    // new instance of our ViewModel
    viewData = new ViewModel();

    // Apply live binding
    ko.applyBindings(viewData);

    chrome.devtools.network.onRequestFinished.addListener(function (request) {
        var url = request.request.url;
        var urlParts = url.split('://');
        var httpsUrl = (urlParts[0] === 'http') ? 'https://' + urlParts[1] : false;
        if (httpsUrl) {
            backgroundPort.postMessage({
                action : "checkhttps",
                url: httpsUrl
            });

            /*
            if (requested.indexOf(httpsUrl) === -1) {
                requested.push(httpsUrl);
                $.ajax({
                    type: 'GET',
                    url: httpsUrl,
                    async: false,
                    success: function () {
                        success = true;
                    },
                    error: function () {
                        success = false;
                    }
                });
                viewData.urls.push({
                    url: httpsUrl,
                    https: (success) ? 'Y' : 'N'
                });
            }
            */

        }
    });

    // listen for and handle page changes...
    chrome.devtools.network.onNavigated.addListener(function (data) {
        // empty results
        viewData.urls([]);
    });

});
