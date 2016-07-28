from nltk.stem.porter import *
from nltk.corpus import stopwords
from nltk.text import TextCollection
import networkx as nx
import math
import itertools
import logging, sys
import copy

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.ERROR)

stopwords = set(stopwords.words('english'))
stemmer = PorterStemmer()

globalSentences = 0
idfCalculator = 0

def calculateDistance(firstString, secondString):
    fs = firstString.split(" ")
    ss = secondString.split(" ")
    fs = [e for e in fs if e not in stopwords]
    ss = [e for e in ss if e not in stopwords]
    fs = [stemmer.stem(e) for e in fs]
    ss = [stemmer.stem(e) for e in ss]
    commonWords = set(fs) & set(ss)
    #tfidfSum = 0
    idfSum = 0
    for w in commonWords:
    #    ftf = [1 for e in fs if e==w]
    #    stf = [1 for e in ss if e==w]
    #    tf = sum(ftf)*sum(stf)
    #    idf = idfCalculator.idf(w)
    #    tfidfSum += (tf*idf*idf)
        idfSum += idfCalculator.idf(w)
    logging.debug("sentenceA: {} \n sentenceB: {}".format(fs, ss))
    normalize = math.ceil(math.log(len(fs)) + math.log(len(ss)))
    if (normalize > 0):
        return idfSum/normalize
    return 0

def buildGraph(nodes):
    "nodes - list of hashables that represents the nodes of the graph"
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

def extractSentences1(sentences, ratio):
    #TODO: return all if less than 5 sentences
    #set up idf calculating data structure
    global globalSentences
    globalSentences = copy.deepcopy(sentences)
    for i in range(0, len(globalSentences)):
        s = globalSentences[i]
        s = s.split(" ")
        s = [e for e in s if e not in stopwords]
        s = [stemmer.stem(e) for e in s]
        s = " ".join(s)
        globalSentences[i] = s
    global idfCalculator
    idfCalculator = TextCollection(globalSentences)
    
    targetLength = int(math.ceil(ratio*len(sentences)))
    graph = buildGraph(sentences)

    calculated_page_rank = nx.pagerank(graph, weight='weight')

    #most important sentences in ascending order of importance
    importantSentences = sorted(calculated_page_rank, key=calculated_page_rank.get, reverse=True)[:targetLength]
    
    #most important sentences in ascending order of appearance in original
    sortedImportantSentences = [s for s in sentences if s in importantSentences]

    return sortedImportantSentences
