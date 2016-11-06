$(function() {
    
    //console.log("SEARCH.JS: JS started");
    $("#results").empty();
    $("#searchbox").keyup(processInputsK);
    $("#searchButton").click(processInputs);
    
    //onload - clear search bar
    if (window.location.hash) {
        //set search bar based on previous entry
        $("#searchbox").val((window.location.hash).slice(1));
        $("#searchbox").trigger("keyup");
    }
    else {
        $("#searchbox").val("");
    }
    
    function processInputsK(e) {
        //if enter key pressed
        if (e.which === 13) {
            processInputs(e);
        }
    }
    
    function processInputs(e) {
        var q = $("#searchbox").val();
        //sanitize input
        q = q.replace(/[^a-z0-9áéíóúñü \.:,_-]/gim,"");
        var slider = parseInt($("#slider").val(), 10);
        $.ajax({
            url: 'http://www.lawmary.com/startsum',
            jsonp: 'showName',
            type: 'GET',
            dataType: "jsonp",
            data: {
                query: q,
                amount: slider,
                format: "json"
            },
            // Work with the response
            success: function(response) {
                console.log("SEARCH.JS first ajax request success"); 
            }
        });
        //console.log("SEARCH.JS: GET function completed");
    }
    
    var poll = 0;
    var pollCounter = 0;
    
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
            poll = 0;
            returnText = returnText.replace(/\*\*-\*\*/gim," </td></tr><tr><td>");
            returnText = '<tr><td>' + returnText + '</td></tr>'
            $("#results").empty();
            $("#results").append('<table class="u-full-width">');
            $("#results").append('<tbody id="summaryText">');
            $("#results").append(returnText);
            $("#results").append('</tbody></table>')
        }
        else if ((returnText != 'W') && (returnText.slice(0, 18) == "Looking for text: ")) {
            $("#casetitle").empty();
            $("#casetitle").append(returnText.slice(18));
        }
        if (pollCounter > 25) {
            clearInterval(poll);
            poll = 0;
            $("#results").empty();
            $("#casetitle").empty();
        }
        pollCounter += 1;
    }
    
    showName = function(data){
        console.log("showName got polling response: " + JSON.stringify(data));
        var id = data["id"];
        $("#results").empty();
        $("#casetitle").empty();
        $("#results").append("Fetching case.  This may take a minute.");
        if (poll != 0) {
            clearInterval(poll);
            poll = 0;
            $("#results").empty();
            $("#casetitle").empty();
        }
        poll = setInterval(function(){pollFunc(id)}, 5000);
        pollCounter = 0;
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
    
    $(".range-slider__range").mousemove(function() {
        $( ".range-slider__value" ).html(this.value+'%');
    });
    $(".range-slider__range").keyup(function() {
        $( ".range-slider__value" ).html(this.value+'%');
    });

});