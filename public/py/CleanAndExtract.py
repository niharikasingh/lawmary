from nltk.stem.porter import *
import nltk.data
import warnings
import networkx as nx
import math
import itertools
import logging, sys
import warnings

#testing locally
home = False

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)

#silence warnings
if (not home):
    warnings.filterwarnings("ignore", "zero out")

def calculateDistance(fs, ss):
    commonWords = len(set(fs) & set(ss))
    if ((len(fs) == 0) or (len(ss) == 0)):
        return 0
    logging.debug("sentenceA: {} \n sentenceB: {}".format(fs, ss))
    normalize = math.ceil(math.log(len(fs)) + math.log(len(ss)))
    if (normalize > 0):
        return commonWords/normalize
    return 0

def buildGraph(nodes, ss):
    gr = nx.Graph() #initialize an undirected graph
    gr.add_nodes_from(nodes)
    nodePairs = list(itertools.combinations(nodes, 2))

    #add edges to the graph (weighted by Levenshtein distance)
    for pair in nodePairs:
        firstString = ss[pair[0]]
        secondString = ss[pair[1]]
        distance = calculateDistance(firstString, secondString)
        gr.add_edge(pair[0], pair[1], weight=distance)

    return gr

def clean(text):
    #remove headings
    text = text.split('\n')
    text = [sen for sen in text if len(sen) >= 10]
    #split into sentences
    if (home == True):
        tokenizer = nltk.data.load('english.pickle')
    else:
        tokenizer = nltk.data.load('public/py/english.pickle')
    sentences = tokenizer.tokenize(' '.join(text))
    for i in range(len(sentences)-1, -1, -1):
        currS = sentences[i]
        #remove material in square brackets
        currS = re.sub(r'\[\d.*?\]', '', currS)
        #remove footnotes after periods, commas
        currS = re.sub(r'([\.,;"a-z])([1-9][0-9]?)( )', r'\1 ', currS)
        #roll up weird endings - check if abbreviation by checking if first letter of current sentence is lower case
        if ((i-1 >= 0) and (len(currS) > 0) and ((u'a' <= currS[0] <= u'z') or (u'0' <= currS[0] <= u'9'))):
            sentences[i-1] += ( u' ' + currS )
            sentences[i] = u''
        else:
            sentences[i] = currS
    sentences = [s for s in sentences if len(s) > 0]
    sumsentences = [s.replace('.', '') for s in sentences]
    stemmer = PorterStemmer()
    for i in range(len(sumsentences)):
        s = sumsentences[i]
        s = re.sub(r'[0-9]?', '', s)
        s = s.split(' ')
        s = [w for w in s if len(w) > 3]
        s = [stemmer.stem(w) for w in s]
        sumsentences[i] = s
    return (sentences, sumsentences)

def soOrdered(impSentences, sentences):
    summary = u'\n'.join(impSentences)
    logging.debug('Type of summary output is {}'.format(type(summary)))
    #add last sentence after making sure it is not "it is so ordered"
    if (len(sentences) >= 1) and (sentences[-1] not in summary) and ("order" not in sentences[-1].lower()):
        summary += (u'\n' + sentences[-1])
    if (len(sentences) >= 2) and (sentences[-2] not in summary) and ("order" in sentences[-1].lower()):
        summary += (u'\n' + sentences[-2])
    return summary

def extractSentences(text, ratio):
    if (home):
        print "Starting function. Ratio = " + ratio
        
    ratio = float(ratio)
    (sentences, ss) = clean(text)
    if (len(sentences) <= 10):
        return sentences
    
    if (home):
        print "Have sentences."

    targetLength = int(math.ceil(ratio*len(sentences)))
    graph = buildGraph(range(len(sentences)), ss)
    calculated_page_rank = nx.pagerank(graph, weight='weight')
    
    if (home):
        print "Have graph."

    #most important sentences in ascending order of importance
    importantSentences = sorted(calculated_page_rank, key=calculated_page_rank.get, reverse=True)[:targetLength]
    
    #most important sentences in ascending order of appearance in original
    sortedImportantSentences = []
    for i in range(len(sentences)):
        if i in importantSentences:
            sortedImportantSentences.append(sentences[i])
    
    summary = soOrdered(sortedImportantSentences, sentences)

    if (home):
        print summary
    return summary

#main function runs script
def main(args):
    logging.debug('Arguments are: {} {}'.format(args[1], args[2]))
    if (home == True):
        with open(args[1], 'r') as readfile:
            readdata = readfile.read().decode("utf8")
        return extractSentences(readdata, args[2])
    else:
        return extractSentences(args[1], args[2])

if __name__ == "__main__":
    main(sys.argv)

#time to beat - 1:05 -- 0:14 -- 0:10