README

The file 'mapCrimesToNodes.js' takes two files as input:
1. interhash.json -- graph representation of San Francisco ways from Open Street Maps
2. filteredCrimes.json -- 2015 crime data from San Francisco open data portal. Data has been filtered to only include crime categories pertaining to outdoor safety for walking or biking.

Running the command 'node mapCrimesToNodes.js' will output a file called 'interhashScores.json' in the same folder. The output file will contain the same nodes and edges as in 'interhash.json', but each edge will be extended with properties for walkDangerScore, bikeDangerScore, and crimeCount.