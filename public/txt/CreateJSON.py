import json
import re
import logging, sys

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

casedict = {}
#translation_table = dict.fromkeys(map(ord, ".,:()-"), None)

#TODO create summaries for all and change filenames to summaries
i = 0
#format: "key": ["caseName docketNumber (year)", "main opinion link", "OPTIONAL dissents/concurrances link etc."]
with open("civpro/index.txt", "r") as readfile, open("casedict.json", "w") as writefile:
    allLines = readfile.readlines()
    for j in range(0, len(allLines)): 
        line = allLines[j]
        #only read every third line
        if (i == 0):
            #strip newline symbol and decode
            caseName = line[:-1].decode("utf8")
            caseNameKey = caseName.lower()
            #get docket number
            docketNumber = allLines[j+1][:-1].decode("utf8")
            caseName += " " + docketNumber
            #TODO convert case name to upper case
            #create filename
            docketNumber = docketNumber.split(' ')
            fileName = docketNumber[:-1]
            logging.debug("fileName = {}".format(fileName))
            fileName[1] = re.sub(r'\.', '', fileName[1])
            fileName = '-'.join(fileName)
            fileName += ".txt"
            fileName = "txt/civpro/" + fileName
            caseArray = [caseName, fileName]
            if (j+2 < len(allLines)) and (len(allLines[j+2][:-1]) != 0):
                dcLine = allLines[j+2][:-1].decode("utf8")
                dcLine = dcLine.split(" ")
                for dc in dcLine:
                    dcFileName = fileName[:-4] + "-" + dc + fileName[-4:]
                    caseArray.append(dcFileName)
            casedict[caseNameKey] = caseArray
        i = (i+1)%3
                
    writefile.write(json.dumps(casedict, sort_keys=True, indent=4).encode("utf8"))