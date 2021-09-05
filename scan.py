# Takes cities.json and runs through all the different regimes mentioned.
# Compiles a complete list of all regimes.

import json
contents = []

try:
    with open("cities.json", 'r') as f:
        contents = json.load(f)
except Exception as e:
    print(e)

regimes = []

dates = [item.get('dates') for item in contents]
for date in dates:
    for entry in date:
        event = entry['event']
        if event not in regimes:
            regimes.append(event)

print(regimes)
