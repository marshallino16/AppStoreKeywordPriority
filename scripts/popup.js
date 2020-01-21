function addExternals() {
    if (!window.jQuery) {
        var jq = document.createElement("script");
        jq.type = "text/javascript";
        jq.src = "https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js";

        document.getElementsByTagName("head")[0].appendChild(jq);
        //console.log("Added jQuery!");
    } else {
        //console.log("jQuery already exists.");
    }
}

function addStoreFronts() {
    $(document).ready(function () {

        chrome.storage.sync.get({
            favStoreFront: '143441'
        }, function (items) {

            let optionsInnerHTML = '';
            storeFronts.forEach(function (el) {
                if (el.id === parseInt(items.favStoreFront)) {
                    optionsInnerHTML += '<option selected value="' + el.id + '">' + el.store + '</option>';
                } else {
                    optionsInnerHTML += '<option value="' + el.id + '">' + el.store + '</option>';
                }
            });
            document.getElementById('storefronts').innerHTML = optionsInnerHTML;
        });

    });
}

function clickTerm(e) {
    console.log("Click");
    console.log(e);
}

function searchKeywordTerm() {
    document.getElementById('terms').innerHTML = '';

    if (window.searchTerm === undefined || window.searchTerm.length === 0) {
        return;
    }

    console.log('Search %s', window.searchTerm);

    let e = document.getElementById('storefronts');
    let strStoreFront = e.options[e.selectedIndex].value;

    $.ajax({
        url: 'https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?clientApplication=Software&term=' + window.searchTerm,
        headers: {
            'x-apple-store-front': strStoreFront + ',29'
        },
        method: 'GET',
        success: function (data) {
            console.log('succes: ' + data);
            window.docdata = data;
            let jsonString = plist.parse(new XMLSerializer().serializeToString(data));
            console.log(jsonString);

            let elements = [['Term', 'Popularity']];
            jsonString.hints.forEach(function (el) {
                // term
                // priority
                // url
                let term = el.term;
                let basicPriority = parseInt(el.priority);
                let priority = Math.floor(100 * basicPriority / 10000);
                let url = el.url

                elements.push([term, priority]);

                document.getElementById('terms').innerHTML += '<li><div class="keyword-text"><span class="keyword-text-span">' + term + '</span></div>\n' +
                    '                <div class="keyword-pop"><span class="pop">' + priority + '<span class="tooltiptext">' + basicPriority + '</span></span></div>\n' +
                    '                <div class="progress">\n' +
                    '                    <div class="progress-bar-' + ((priority < 10) ? 'red' : (priority < 50 ? 'orange' : 'green')) + '" style="width: ' + priority + '%"></div>\n' +
                    '                </div>\n' +
                    '            </li>'
            });


            let csvContent = "data:text/csv;charset=utf-8,"
                + elements.map(e => e.join(",")).join("\n");
            let encodedUri = encodeURI(csvContent);

            document.getElementsByClassName("download")[0].style.visibility = (elements.length > 0 ? "visible" : "hidden");
            document.getElementsByClassName("download-link")[0].href = encodedUri;
            document.getElementsByClassName("download-link")[0].download = window.searchTerm + "_export.csv";

        }
    });
}

addExternals();
addStoreFronts();
// Triggers
document.addEventListener('DOMContentLoaded', function () {


    document.getElementById('search').addEventListener('keyup', function (event) {
        console.log(event.target.value);
        window.searchTerm = event.target.value;
        searchKeywordTerm();
    });

    document.getElementById('search').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            searchKeywordTerm();
        }
    });

    document.getElementById('storefronts').addEventListener('change', function (event) {
        let e = document.getElementById('storefronts');
        let strStoreFront = e.options[e.selectedIndex].value;
        console.log(strStoreFront);

        chrome.storage.sync.set({
            favStoreFront: strStoreFront
        }, function () {
            console.log('Preferences saved.')
        });
    });


    document.getElementById('search-button').addEventListener('click', function () {
        searchKeywordTerm();
    });

    document.addEventListener('click', function (e) {

        if (e.target && (e.target.className == 'keyword-text' || e.target.className == 'keyword-text-span')) {

            let str = "[" + e.target.innerText + "]";
            console.log(str);

            const el = document.createElement('textarea');
            el.value = str;
            el.setAttribute('readonly', '');
            el.style.position = 'absolute';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            const selected =
                document.getSelection().rangeCount > 0
                    ? document.getSelection().getRangeAt(0)
                    : false;
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            if (selected) {
                document.getSelection().removeAllRanges();
                document.getSelection().addRange(selected);
            }
        }
    });
});


