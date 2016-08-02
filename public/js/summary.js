$(function() {
    
    window.selectedRows = [];
    
    var queryDict={};
    window.location.search.replace(/[?&;]+([^=]+)=([^&;]*)/gi,function(str,key,value){queryDict[key] = value;});
    
    if (queryDict["exam"] == "true") {
        $("table").before('<div class="search-text">Please note: Exam mode has not been created for this summary yet.  Please click on the sections below to highlight facts and create your own exam mode.  Once enough people have done so, exam mode will automatically be created.  </div><br/>');
    }
    
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
    
    //REQUIRES: link, senLength, examMode[]
    window.onbeforeunload = function() {
        console.log("SUMMARY.JS: starting unload function.")
        $.ajax({
            url: "http://www.lawmary.com/casedict",
            type: "PUT",
            data: JSON.stringify({
                link: fileLocation,
                senLength: $('td').length,
                examMode: selectedRows
            }),
            dataType: "JSON",
            async: false,
            contentType:"application/json",
            // Work with the response
            success: function(response) {
                console.log("SUMMARY.JS SUCCESS"); 
            }
        });
    };

});


