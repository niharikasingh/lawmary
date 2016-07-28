from sklearn.feature_extraction.text import TfidfVectorizer
import logging, sys

#Finds accuracy of summary

#set up logging
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG)

def findSim(file1, file2):
    #file1 = filename[:-4] + "syl.txt"
    #file2 = filename[:-4] + "sum.txt"
    documents = [open(file1, 'r').read(), open(file2, 'r').read()]
    tfidf = TfidfVectorizer().fit_transform(documents)
    pairwise_similarity = tfidf * tfidf.T
    simValue = pairwise_similarity.A[1][0]
    logging.debug('findSim Function:\t with {} and {} similarity is {}'.format(file1, file2, simValue))
    if (simValue < 0.8):
        logging.error('findSim Function:\t LOW SIMILARITY - with {} and {} similarity is {}'.format(file1, file2, simValue))

findSim("test1syl.txt", "test1-sum.txt")
findSim("test1syl.txt", "test1-sum1.txt")
findSim("test2syl.txt", "test2-sum.txt")
findSim("test2syl.txt", "test2-sum1.txt")
findSim("test3syl.txt", "test3-sum.txt")
findSim("test3syl.txt", "test3-sum1.txt")
findSim("test4syl.txt", "test4-sum.txt")
findSim("test4syl.txt", "test4-sum1.txt")
findSim("test5syl.txt", "test5-sum.txt")
findSim("test5syl.txt", "test5-sum1.txt")

#10001
"""DEBUG:root:findSim Function:	 with test1syl.txt and test1-sum.txt similarity is 0.945668705101
DEBUG:root:findSim Function:	 with test1syl.txt and test1-sum1.txt similarity is 0.947841236903
DEBUG:root:findSim Function:	 with test2syl.txt and test2-sum.txt similarity is 0.902890480037
DEBUG:root:findSim Function:	 with test2syl.txt and test2-sum1.txt similarity is 0.898409406044
DEBUG:root:findSim Function:	 with test3syl.txt and test3-sum.txt similarity is 0.847017860948
DEBUG:root:findSim Function:	 with test3syl.txt and test3-sum1.txt similarity is 0.825608375467
DEBUG:root:findSim Function:	 with test4syl.txt and test4-sum.txt similarity is 0.886001143416
DEBUG:root:findSim Function:	 with test4syl.txt and test4-sum1.txt similarity is 0.86901084343
DEBUG:root:findSim Function:	 with test5syl.txt and test5-sum.txt similarity is 0.850423782726
DEBUG:root:findSim Function:	 with test5syl.txt and test5-sum1.txt similarity is 0.862291824749"""
#01001
"""DEBUG:root:findSim Function:	 with test1syl.txt and test1-sum.txt similarity is 0.945668705101
DEBUG:root:findSim Function:	 with test1syl.txt and test1-sum1.txt similarity is 0.942890711622
DEBUG:root:findSim Function:	 with test2syl.txt and test2-sum.txt similarity is 0.902890480037
DEBUG:root:findSim Function:	 with test2syl.txt and test2-sum1.txt similarity is 0.915576125497
DEBUG:root:findSim Function:	 with test3syl.txt and test3-sum.txt similarity is 0.847017860948
DEBUG:root:findSim Function:	 with test3syl.txt and test3-sum1.txt similarity is 0.846481281086
DEBUG:root:findSim Function:	 with test4syl.txt and test4-sum.txt similarity is 0.886001143416
DEBUG:root:findSim Function:	 with test4syl.txt and test4-sum1.txt similarity is 0.873501324502
DEBUG:root:findSim Function:	 with test5syl.txt and test5-sum.txt similarity is 0.850423782726
DEBUG:root:findSim Function:	 with test5syl.txt and test5-sum1.txt similarity is 0.859260356868"""