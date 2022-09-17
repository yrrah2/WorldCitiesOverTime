import json
import codecs

d = codecs.open("cities.json", 'r', "utf-8-sig")
contents = json.load(d)

def add_city(city_list, name, latitude, longitude):
    already = True
    for city in city_list:
        if city["name"] == name:
            already = False
    if already:
        new_city = {}
        new_city["name"] = name
        new_city["latitude"] = latitude
        new_city["longitude"] = longitude
        new_city["history"] = []

        city_list.append(new_city)

        with open("cities.json", 'w') as f:
            s = json.dumps(city_list, indent=4)
            f.write(s)
    else:
        print("Sorry, that city is already there!")

def convert_date(date):
    result = []
    modifier = 1
    if date[0] == '-':
        modifier = -1
        date = date[1:]
    result.append(modifier)
    year = int(date[0:4])
    result.append(year)
    if len(date) >= 5:
        month = int(date[5:7])
        result.append(month)
    if len(date) >= 8:
        day = int(date[8:10])
        result.append(day)
    return result

def is_after(date1, date2):
    date_list1 = convert_date(date1)
    date_list2 = convert_date(date2)

    while len(date_list1) < 4:
        date_list1.append(1)
    while len(date_list2) < 4:
        date_list2.append(1)

    if date_list1[0] == 1:
        r = True
    if date_list1[0] == -1:
        r = False

    if date_list2[0] < date_list1[0]:
        return 1
    elif date_list2[0] > date_list1[0]:
        return 0
    else:
        if date_list2[1] < date_list1[1]:
            return r
        if date_list2[1] > date_list1[1]:
            return not r
        else:
            if date_list2[2] < date_list1[2]:
                return r
            if date_list2[2] > date_list1[2]:
                return not r
            else:
                if date_list2[3] < date_list1[3]:
                    return r
                if date_list2[3] > date_list1[3]:
                    return not r
                else:
                    return False


def add_event(city_list, city_name, event_type, event, date):
    for city in city_list:
        if city["name"] == city_name:
            event_entry = {"date": date, "type": event_type, "regime": event}
            history = city["history"]
            if event_entry in history:
                print("Event already in the event list")
            else:
                if len(history) == 0:
                    history.append(event_entry)
                else:
                    n = -1
                    for i in range(len(history)):
                        if is_after(date, history[i]["date"]):
                            n = i
                    history.insert(n+1, event_entry)

                city["history"] = history
                s = json.dumps(city_list, indent=4)

                with open("cities.json", 'w') as f:
                    f.write(s)



#add_city(contents, "Calais", 50.948056, 1.856389)
#add_event(contents, "Manila", "Republic of the Phillipines", "1946/06/04")a
