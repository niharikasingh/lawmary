from nltk.stem.porter import *
import nltk.data
import warnings
import networkx as nx
import math
import itertools
import logging, sys
import warnings

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)

#silence warnings
warnings.filterwarnings("ignore", "UserWarning")

#get stopwords
sw = set()
with open('public/py/english', 'r') as stopfile:
    for line in stopfile:
        sw.add(line[:-1])
for i in range(97, 123):
    sw.add(chr(i))

def calculateDistance(firstString, secondString):
    fs = firstString.replace('.', '')
    ss = secondString.replace('.', '')
    fs = fs.split(" ")
    ss = ss.split(" ")
    fs = [e for e in fs if e not in sw]
    ss = [e for e in ss if e not in sw]
    stemmer = PorterStemmer()
    fs = [stemmer.stem(e) for e in fs]
    ss = [stemmer.stem(e) for e in ss]
    commonWords = set(fs) & set(ss)
    commonWords = len(commonWords)
    logging.debug("sentenceA: {} \n sentenceB: {}".format(fs, ss))
    normalize = math.ceil(math.log(len(fs)) + math.log(len(ss)))
    if (normalize > 0):
        return commonWords/normalize
    return 0

def buildGraph(nodes):
    gr = nx.Graph() #initialize an undirected graph
    gr.add_nodes_from(nodes)
    nodePairs = list(itertools.combinations(nodes, 2))

    #add edges to the graph (weighted by Levenshtein distance)
    for pair in nodePairs:
        firstString = pair[0]
        secondString = pair[1]
        distance = calculateDistance(firstString, secondString)
        gr.add_edge(firstString, secondString, weight=distance)

    return gr

def clean(text):
    #remove newlines
    re.sub(r'\n', '', text)
    #split into sentences
    tokenizer = nltk.data.load('public/py/english.pickle')
    sentences = tokenizer.tokenize(text)
    for i in range(len(sentences)-1, -1, -1):
        currS = sentences[i]
        #remove material in square brackets
        currS = re.sub(r'\[\d.*?\]', '', currS)
        #remove footnotes after periods, commas
        currS = re.sub(r'([\.,;"a-z])([1-9][0-9]?)( )', r'\1 ', currS)
        #roll up weird endings - check if abbreviation by checking if last word in sentence has an upper case first letter
        currSWords = currS.replace('.', '')
        currSWords = currSWords.split(" ")
        lastWord = currSWords[-1]
        if (i+1 < len(sentences)) and (((len(lastWord) > 0) and (u'A' <= lastWord[0] <= u'Z')) or (currS[-3:]==u'pp.') or (currS[-3:]==u'no.')):
            logging.debug('clean Function:\t joined improperly split sentence {}'.format(currS.encode("utf8")))
            currS += ( u' ' + sentences[i+1] )
            sentences[i+1] = u''
            sentences[i] = currS
        #roll up weird endings - check if abbreviation by checking if first letter of current sentence is lower case
        elif ((i-1 >= 0) and (len(currS) > 0) and ((u'a' <= currS[0] <= u'z') or (u'0' <= currS[0] <= u'9'))):
            sentences[i-1] += ( u' ' + currS )
            sentences[i] = u''
        else:
            sentences[i] = currS
    sentences = [s for s in sentences if len(s) > 0]
    return sentences

def soOrdered(impSentences, sentences):
    summary = u'\n'.join(impSentences)
    logging.debug('Type of summary output is {}'.format(type(summary)))
    #add last sentence after making sure it is not "it is so ordered"
    if (len(sentences) >= 1) and (sentences[-1] not in summary) and ("order" not in sentences[-1].lower()):
        summary += (u'\n' + sentences[-1])
    if (len(sentences) >= 2) and (sentences[-2] not in summary) and ("order" in sentences[-1].lower()):
        summary += (u'\n' + sentences[-2])

def extractSentences(text, ratio):
    ratio = float(ratio)
    sentences = clean(text)
    if (len(sentences) <= 10):
        return sentences
    targetLength = int(math.ceil(ratio*len(sentences)))
    graph = buildGraph(sentences)

    calculated_page_rank = nx.pagerank(graph, weight='weight')

    #most important sentences in ascending order of importance
    importantSentences = sorted(calculated_page_rank, key=calculated_page_rank.get, reverse=True)[:targetLength]
    
    #most important sentences in ascending order of appearance in original
    sortedImportantSentences = [s for s in sentences if s in importantSentences]
    
    summary = soOrdered(sortedImportantSentences, sentences)

    return summary

#main function runs script
def main(args):
    logging.debug('Arguments are: {} {}'.format(args[1], args[2]))
    return extractSentences(args[1], args[2])

if __name__ == "__main__":
    main(sys.argv)
