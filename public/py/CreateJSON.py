import json
import re
import logging, sys

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)

casedict = {}

i = 0
#format: var CaseSchema = new Schema( {
#        name: String,
#        link: String,
#        tags: [String],
#        visited: Number,
#        examMode: [Number]
#    });
with open("index.txt", "r") as readfile, open("../js/casedict.json", "w") as writefile:
    allLines = readfile.readlines()
    for j in range(0, len(allLines)): 
        line = allLines[j]
        #only read every third line
        if (i == 0):
            #strip newline symbol and decode
            caseName = line[:-1].decode("utf8")
            #convert case name to upper case
            caseName = caseName.split(u'v.')
            caseName = [w.upper() for w in caseName]
            caseName = u'v.'.join(caseName)
            #get docket number
            docketNumber = allLines[j+1][:-1].decode("utf8")
            caseName += "   " + docketNumber
            
            #create main filename
            docketNumber = docketNumber.split(' ')
            fileName = docketNumber[:-1]
            logging.debug("fileName = {}".format(fileName))
            fileName[1] = re.sub(r'\.', '', fileName[1])
            fileName = '-'.join(fileName)
            fileName += "-sum.txt"
            fileName = "py/sum/" + fileName
            caseArray = [fileName]
            
            #create concur/dissent filenames
            if (j+2 < len(allLines)) and (len(allLines[j+2][:-1]) != 0):
                dcLine = allLines[j+2][:-1].decode("utf8")
                dcLine = dcLine.split(" ")
                for dc in dcLine:
                    dcFileName = fileName[:-8] + "-" + dc + fileName[-8:]
                    caseArray.append(dcFileName)
            
            #add in JSON format
            for case in caseArray:
                currCase = {"name": caseName, 
                            "link": case, 
                            "tags": [], 
                            "visited": 0,
                            "examMode": []}
                casedict.append(currCase)
                
        i = (i+1)%3
                
    writefile.write(json.dumps(casedict, sort_keys=True, indent=4).encode("utf8"))