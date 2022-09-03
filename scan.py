# Takes cities.json and runs through all the different regimes mentioned.
# Compiles a complete list of all regimes.

import codecs
import json
contents = []

d = codecs.open("cities.json", 'r', "utf-8-sig")
contents = json.load(d)

regimes = []

dates = [item.get('dates') for item in contents]
for date in dates:
    for entry in date:
        event = entry['event']
        if event not in regimes:
            regimes.append(event)

s = json.dumps(regimes, indent=4)

with open("regimes.json", 'w') as f:
    f.write(s)
