$(function() {
    
    window.selectedRows = [];
    
    var queryDict={};
    window.location.search.replace(/[?&;]+([^=]+)=([^&;]*)/gi,function(str,key,value){queryDict[key] = value;});
    
    var fileLocation = decodeURIComponent(queryDict["txt"]);
    
    //console.log(fileLocation);
    $.get(fileLocation,function(txt){
        //console.log(txt);
        var fileText = txt.replace(/\n/g, ' </td></tr><tr><td>'); 
        fileText = fileText.replace(/'/g, "′")
        fileText = '<tr><td>' + fileText + '</td></tr>'
        //console.log(fileText);
        $("#summaryText").append(fileText);
        
        $("td").each(function() {
            this.addEventListener('click', function(e) {        
                var currRowIndex = $('td').index(this);
                if (!selectedRows[currRowIndex]) {
                    $(this).css("background-color", "#f4b305");
                    $(this).css("border-radius", "4px");
                    selectedRows[currRowIndex] = true;
                }
                else {
                    if (selectedRows[currRowIndex]) {
                        selectedRows[currRowIndex] = false;
                        $(this).css("background-color", "#ffffff");
                    }
                    else {
                        selectedRows[currRowIndex] = true;
                        $(this).css("background-color", "#f4b305");
                        $(this).css("border-radius", "4px");
                    }
                }
                console.log(selectedRows);
            });
        });
    });    
    
    
        
    $("#copyButton").click(function() {
        var succeed = copyToClipboard($("#summaryText"));
        if (succeed) {
            $("#copyButton").val('COPIED');
        }
        else {
            $("#copyButton").val('ERROR');
        }
    });

    function copyToClipboard(elem) {
        var $temp = $("<input>");
        $("body").append($temp);
        $temp.val(elem.text()).select();
        var succeed = false;
        try {
    	  succeed = document.execCommand("copy");
        } catch(e) {
            succeed = false;
        }
        $temp.remove();
        return succeed;
    }
    
    $("#examButton").click(function() {
        hideRows();
        if ($("#examButton").val() == 'EXAM MODE') {
            $("#examButton").val('READ MODE');
            $("#examButtonLabelText").html(" Click to show entire summary ");
        } 
        else {
            $("#examButton").val('EXAM MODE');
            $("#examButtonLabelText").html(" Click to only show facts (highlighted in yellow), so you can practice writing reasoned judgements ");
        }
         
    });
    
    function hideRows() {
        $("td").each(function() {
            var currRowIndex = $('td').index(this);
            if (!selectedRows[currRowIndex]) {
                $(this).toggle(300);
            }
        });
    }
    
    if (queryDict["exam"] == "true") {
        $.ajax({
            url: "http://www.lawmary.com/casedict",
            type: "GET",
            data: {
                link: fileLocation,
                format: "json"
            },
            dataType: "json",
            contentType:"application/json",
            success: function(response) {
                console.log(response);
                if (response.length == 0) {
                    $("table").before('<div class="search-text">Please note: Exam mode has not been created for this summary yet.  Please click on the sections below to highlight facts and create your own exam mode.  Once enough people have done so, exam mode will automatically be created.  </div><br/>');
                }
                else {
                    $("#examButton").val('READ MODE');
                    $("#examButtonLabelText").html(" Click to show entire summary ");
                    for (var i = 0; i < response.length; i++) {
                        if (response[i] < 10) {
                            $('td').index(i).toggle(300);
                        }
                        else {
                            $('td').index(i).css("background-color", "#f4b305");
                            $('td').index(i).css("border-radius", "4px");
                        }
                    }
                }
            }
        });  
    }
    
    //REQUIRES: link, senLength, examMode[]
    window.onbeforeunload = function() {
        console.log("SUMMARY.JS: starting unload function.")
        $.ajax({
            url: "http://www.lawmary.com/casedict",
            type: "POST",
            data: JSON.stringify({
                link: fileLocation,
                senLength: $('td').length,
                examMode: selectedRows,
                format: "json"
            }),
            dataType: "json",
            contentType:"application/json",
            success: function(response) {
                console.log("SUMMARY.JS PUT SUCCESS"); 
            }
        });
    };

});


