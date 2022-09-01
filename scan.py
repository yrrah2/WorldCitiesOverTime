# Takes cities.json and runs through all the different regimes mentioned.
# Compiles a complete list of all regimes.

import codecs
import json
contents = []

try:
    with open("cities.json", 'r') as f:
        d = codecs.open('cities.json', 'r', 'utf-8-sig')
        contents = json.load(d)
except Exception as e:
    print(e)

regimes = []

dates = [item.get('dates') for item in contents]
for date in dates:
    for entry in date:
        event = entry['event']
        if event not in regimes:
            regimes.append(event)

with open("regimes.json", 'w') as f:
    s = json.dumps(regimes)
    f.write(s)

print(regimes)
