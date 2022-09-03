import json
import codecs

d = codecs.open("cities.json", 'r', "utf-8-sig")
contents = json.load(d)

def add_city(city_list, name, latitude, longitude):
    already = True
    for city in city_list:
        if city["city"] == name:
            already = False
    if already:
        new_city = {}
        new_city["city"] = name
        new_city["latitude"] = latitude
        new_city["longitude"] = longitude
        new_city["dates"] = []

        city_list.append(new_city)

        with open("cities.json", 'w') as f:
            s = json.dumps(city_list, indent=4)
            f.write(s)
    else:
        print("Sorry, that city is already there!")

def convert_date(date):
    modifier = 1
    if date[0] == '-':
        modifier = -1
        date = date[1:]
    year = int(date[0:4])
    month = int(date[5:7])
    day = int(date[8:10])
    return (modifier, year, month, day)

def is_after(date1, date2):
    m1, n1, y1, r1 = convert_date(date1)
    m2, n2, y2, r2 = convert_date(date2)

    if m1 == 1:
        r = True
    if m1 == -1:
        r = False

    if m2 < m1:
        return 1
    elif m1 < m2:
        return 0
    else:
        if n2 < n1:
            return r
        if n1 < n2:
            return not r
        else:
            if y2 < y1:
                return r
            if y1 < y2:
                return not r
            else:
                if r2 < r1:
                    return r
                if r1 < r2:
                    return not r
                else:
                    return Exception("The dates are the same.")


def add_event(city_list, city_name, event, date):
    for city in city_list:
        if city["city"] == city_name:
            event_entry = {"year": date, "event": event}
            dates = city["dates"]
            if event_entry in dates:
                print("Event already in the event list")
            else:
                if len(dates) == 0:
                    dates.append(event_entry)
                else:
                    n = -1
                    for i in range(len(dates)):
                        if is_after(date, dates[i]["year"]):
                            n = i
                    dates.insert(n+1, event_entry)

                city["dates"] = dates
                s = json.dumps(city_list, indent=4)

                with open("cities.json", 'w') as f:
                    f.write(s)



#add_city(contents, "Calais", 50.948056, 1.856389)
add_event(contents, "Calais", "Kingdom of England", "1347/08/03")
add_event(contents, "Calais", "Kingdom of France", "1558/01/08")
add_event(contents, "Calais", "Spanish Empire", "1596/04/24")
add_event(contents, "Calais", "Kingdom of France", "1598/05/02")
add_event(contents, "Calais", "Nazi Military Occupation", "1940/05/26")
add_event(contents, "Calais", "Provisional Government of the French Republic", "1944/10/01")
add_event(contents, "Calais", "Fourth French Republic", "1946/10/27")
add_event(contents, "Calais", "Fifth French Republic", "1958/10/04")
