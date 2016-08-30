import os
import ReadAndWrite

completedFiles = []
for subdir, dirs, files in os.walk("sum"):
    for file in files:
        filename = file[:-8] + ".txt"
        completedFiles.append(filename)

for subdir, dirs, files in os.walk("002"):
    for file in files:
        if (file not in completedFiles):
            filepath = subdir + os.sep + file
            if filepath.endswith(".txt"):
                ReadAndWrite.process(filepath)
        else:
            print file