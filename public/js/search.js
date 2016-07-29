$(function() {
    
    console.log("SEARCH.JS: JS started");
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
        q = q.toLowerCase();
        if (q.length >= 3) {
            $.ajax({
                url: 'http://lawmary.herokuapp.com/nodesearch',
                jsonp: 'callbackDisplay',
                type: 'GET',
                dataType: "jsonp",
                data: {
                    query: q,
                    format: "json"
                },
                // Work with the response
                success: function(response) {
                    console.log("SEARCH.JS SUCCESS"); 
                }
            });
            console.log("SEARCH.JS: GET function completed");
        }
        else {
            $("#results").empty();
        }
    }
    
    callbackDisplay = function(data){
        console.log("SEARCH.JS starting callback function");
        console.log("SEARCH.JS checkbox is " + $('#examCheckbox').is(":checked"));
        allResults = data["results"];
        $("#results").empty();
        for (var i = 0; i < allResults.length; i++) {
            links = allResults[i];
            if (links.length == 2) {
                $("#results").append("<li> <a id='resultlink' href ='summary.html?" + $.param({"txt":links[1], "exam":$('#examCheckbox').is(":checked")}) + "'>" + links[0] + "</a></li>");
                    }
            else if (links.length > 2){
                appendStr = "<li> <a id='resultlink' href ='summary.html?" + $.param({"txt":links[1], "exam":$('#examCheckbox').is(":checked")}) + "'>" + links[0] + "</a><ul>";
                for(var j = 2; j < links.length; j++) {
                    if (links[j].indexOf("-c") > -1) {
                        appendStr += "<li><a id='resultlink' href='summary.html?" + $.param({"txt":links[j], "exam":$('#examCheckbox').is(":checked")}) + "'>Concurrence</a></li>";
                    }
                    else {
                        appendStr += "<li><a id='resultlink' href='summary.html?" + $.param({"txt":links[j], "exam":$('#examCheckbox').is(":checked")}) + "'>Dissent</a></li>";
                    }
                }
                appendStr += "</ul>"
                $("#results").append(appendStr);
            }
            //save state when navigating away
            $("#resultlink").each(function() {
                this.addEventListener('click', function(e) {
                    // Create a new history item.
                    window.location.hash = $("#searchbox").val();
                });   
            });
        }
    }

});