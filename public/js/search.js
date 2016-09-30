$(function() {
    
    //console.log("SEARCH.JS: JS started");
    $("#results").empty();
    $("#searchbox").keyup(processInputs);
    $("#examCheckbox").click(processInputs);
    
    //onload - clear search bar
    if (window.location.hash) {
        //set search bar based on previous entry
        $("#searchbox").val((window.location.hash).slice(1));
        $("#searchbox").trigger("keyup");
    }
    else {
        $("#searchbox").val("");
    }
    
    function processInputs(e) {
        var q = $("#searchbox").val();
        //sanitize input
        q = q.replace(/[^a-z0-9áéíóúñü \.:,_-]/gim,"");
        //if enter key pressed
        if (e.which === 13) {
            $.ajax({
                url: 'http://www.lawmary.com/startsum',
                jsonp: 'showName',
                type: 'GET',
                dataType: "jsonp",
                data: {
                    query: q,
                    format: "json"
                },
                // Work with the response
                success: function(response) {
                    console.log("SEARCH.JS first ajax request success"); 
                }
            });
            //console.log("SEARCH.JS: GET function completed");
        }
    }
    
    var poll;
    
    function pollFunc(id) {
        console.log("Sending polling function.")
        $.ajax({
            url: 'http://www.lawmary.com/getsum/'+id,
            type: 'GET',
            dataType: "jsonp",
            jsonp: 'showSum',
            // Work with the response
            success: function(response) {
                //NONE
            }
        });
    }
    
    showSum = function(data){
        var returnText = "";
        returnText = decodeURI(data[0]);
        if ((returnText != 'W') && (returnText.slice(0, 18) != "Looking for text: ")) {
            clearInterval(poll);
            $("#results").empty();
            $("#results").append(returnText);
        } 
    }
    
    showName = function(data){
        console.log("showName got polling response: " + JSON.stringify(data));
        var id = data["id"];
        $("#results").empty();
        $("#results").append("Fetching case.  This may take a minute.");
        var returnText = "";
        poll = setInterval(function(){pollFunc(id)}, 5000);
    };
    
    callbackDisplay = function(data){
        //console.log("SEARCH.JS starting callback function");
        //console.log("SEARCH.JS checkbox is " + $('#examCheckbox').is(":checked"));
        allResults = data["results"];
        $("#results").empty();
        if (allResults[0].length == 0) return;
        for (var i = 0; i < allResults.length; i++) {
            links = allResults[i];
            linkName = links[0];
            links = links.slice(1);
            links.sort();
            links.unshift(links.pop());
            //console.log("SEARCH.JS - sorted links: " + links);
            if (links.length == 1) {
                $("#results").append("<li> <a id='resultlink' href ='summary.html?" + $.param({"txt":links[0], "exam":$('#examCheckbox').is(":checked")}) + "'>" + linkName + "</a></li>");
            }
            else if (links.length > 1){
                appendStr = "<li> <a id='resultlink' href ='summary.html?" + $.param({"txt":links[0], "exam":$('#examCheckbox').is(":checked")}) + "'>" + linkName + "</a><ul>";
                for(var j = 1; j < links.length; j++) {
                    if (links[j].indexOf("-cd") > -1) {
                        appendStr += "<li><a id='resultlink' href='summary.html?" + $.param({"txt":links[j], "exam":$('#examCheckbox').is(":checked")}) + "'>Concurrence in Part, Dissent in Part</a></li>";
                    }
                    else if (links[j].indexOf("-c") > -1) {
                        appendStr += "<li><a id='resultlink' href='summary.html?" + $.param({"txt":links[j], "exam":$('#examCheckbox').is(":checked")}) + "'>Concurrence</a></li>";
                    }
                    else {
                        appendStr += "<li><a id='resultlink' href='summary.html?" + $.param({"txt":links[j], "exam":$('#examCheckbox').is(":checked")}) + "'>Dissent</a></li>";
                    }
                }
                appendStr += "</ul>";
                $("#results").append(appendStr);
            }
        }
        //save state when navigating away
        $("a").click(function(e) {
            // Create a new history item.
            window.location.hash = $("#searchbox").val();
        });   
    };

});