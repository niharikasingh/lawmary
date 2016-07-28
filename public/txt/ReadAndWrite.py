import logging, sys
import nltk.data
import re
from summa.summarizer import summarize
import ExtractSentences
import ExtractSentences1

#Cleans and summarizes document

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)

#returns true if a line only includes heading characters
#sample headings: A, B, C, I, II, III, IV
def isHeading(testUnic):
    logging.debug('isHeading Function:\t testing string:\t {}'.format(testUnic.encode("utf8")))
    #remove material in square brackets
    testUnic = re.sub(r'\[\d.*?\]', '', testUnic)
    #if line has any characters except [A-Z \. \* 0-9] it is not a heading
    testUnic = re.sub(r'[A-Z\.\*0-9 ]', '', testUnic)
    if (len(testUnic) == 0):
        logging.debug('isHeading Function:\t found heading')
        return False
    return True

def clean(sentences):
    for i in range(len(sentences)-1, -1, -1):
        currS = sentences[i]
        #remove material in square brackets
        currS = re.sub(r'\[\d.*?\]', '', currS)
        #remove footnotes after periods, commas
        currS = re.sub(r'([\.,;"a-z])([1-9][0-9]?)( )', r'\1 ', currS)
        #roll up weird endings
        if (i+1 < len(sentences)) and ((currS[-4:]==u'Arg.') or (currS[-4:]==u'App.') or (currS[-4:]==u'Pet.') or (currS[-5:]==u'Cert.') or (currS[-3:]==u'Tr.') or (currS[-3:]==u'pp.') or (currS[-3:]==u'No.')):
            logging.debug('clean Function:\t joined improperly split sentence {}'.format(currS.encode("utf8")))
            currS += ( u' ' + sentences[i+1] )
            sentences[i+1] = u''
        sentences[i] = currS
    sentences = [s for s in sentences if len(s) > 0]
    return sentences

#input: file with PDF input of decision
#output: file with each sentence in a new line, summary of file
def process(filename):
    text = ""
    with open(filename, "r") as decisionPdf:
        for line in decisionPdf.readlines():
            #strip newline symbol and decode
            lineStripped = line[:-1].decode("utf8")
            #join words split on different lines by '-'
            if (lineStripped[-1] == u"-"):
                lineStripped = lineStripped[:-1]
            else:
                lineStripped += u" "
            #remove headings
            if (len(lineStripped) > 5):
                text += lineStripped
            elif (not isHeading(lineStripped[:-1])):
                text += lineStripped
    #ellipses should not be three separate sentences
    fixEllipses = u' . . . '
    #fixEllipses = u'Foreign'
    text = text.replace(fixEllipses, u'...')
    #split into sentences
    tokenizer = nltk.data.load('tokenizers/punkt/english.pickle')
    sentences = tokenizer.tokenize(text)
    sentences = clean(sentences)
    
    #output result file
    #toWrite = '\n'.join(sentences)
    #senFile = filename[:-4] + "sen.txt"
    #with open(senFile, "w") as senFileOpen:
    #    senFileOpen.write(toWrite.encode("utf8"))
        
    #summarize
    #summary = summarize(sentences, True, ratio=0.1)
    summary = ExtractSentences.extractSentences(sentences, 0.1)
    summary = u'\n'.join(summary)
    logging.debug('Type of summary output is {}'.format(type(summary)))
    #add last sentence after making sure it is not "it is so ordered"
    if (sentences[-1] not in summary) and ("so ordered" not in sentences[-1].lower()):
        summary += (u'\n' + sentences[-1])
    if (sentences[-2] not in summary) and ("so ordered" in sentences[-1].lower()):
        summary += (u'\n' + sentences[-2])
    sumFile = filename[:-4] + "-sum.txt"
    with open(sumFile, "w") as sumFileOpen:
        sumFileOpen.write(summary.encode("utf8"))
    
    #for testing only
    #summary1 = ExtractSentences1.extractSentences1(sentences, 0.1)
    #summary1 = " ".join(summary1)
    #if (sentences[-1] not in summary1):
    #    summary1 += (u'\n' + sentences[-1])
    #sumFile1 = filename[:-4] + "-sum1.txt"
    #with open(sumFile1, "w") as sumFileOpen1:
    #    sumFileOpen1.write(summary1.encode("utf8"))
    
process("test1.txt")
#process("test2.txt")
#process("test3.txt")
#process("test4.txt")
#process("test5.txt")