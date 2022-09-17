# Takes cities.json and runs through all the different regimes mentioned.
# Compiles a complete list of all regimes.

import codecs
import json
contents = []

d = codecs.open("cities.json", 'r', "utf-8-sig")
contents = json.load(d)

regimes = []

history = [item.get('history') for item in contents]
for date in history:
    for entry in date:
        regime = entry["regime"]
        event_bool = 1
        if "type" in entry:
            event_type = entry["type"]
            print(event_type)
            if event_type == 0:
                event_bool = 0
        if regime not in regimes and event_bool:
            regimes.append(regime)

s = json.dumps(regimes, indent=4)

with open("regimes.json", 'w') as f:
    f.write(s)
