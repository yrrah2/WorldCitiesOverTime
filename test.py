import csv

class date:
    def __init__(self, era, year, month, day):
        self.era = era
        self.year = year
        self.month = month
        self.day = day

    def __eq__(self, other):
        if self.era == other.era and self.year == other.year and self.month == other.month and self.day == other.day:
            return True
        else:
            return False

    def __gt__(self, other):
        if self.era > other.era:
            return True
        elif self.era < other.era:
            return False
        elif self.era == 1:
            if self.year > other.year:
                return True
            elif self.year < other.year:
                return False
            else:
                if self.month > other.month:
                    return True
                elif self.month < other.month:
                    return False
                else:
                    if self.day > other.day:
                        return True
                    elif self.day < other.day:
                        return False
        else:
            self.era, other.era = 1, 1
            v = date.__lt__(self, other)
            self.era, other.era = 0, 0
            return v
    
    def __lt__(self, other):
        if date.__gt__(self, other):
            return False
        elif date.__eq__(self, other):
            return False
        else:
            return True

    def __le__(self, other):
        if date.__lt__(self, other) or date.__eq__(self, other):
            return True
        else:
            return False

    def __ge__(self, other):
        if date.__gt__(self, other) or date.__eq__(self, other):
            return True
        else:
            return False
    
    def strptime(string):
        i = 0
        l = [0,0,0]
        b = ''
        era = 1
        for char in string:
            if char in ['1','2','3','4','5','6','7','8','9','0']:
                b += char
            elif char == '/':
                l[i]=int(b)
                b = ''
                i += 1
            elif char == '-':
                era = 0
        l[i]=int(b)
        return date(era, l[0], l[1], l[2])

def latest(times, regimes, pivot):
    if times[0] > pivot:
        return None
    i = 0
    for time in times:
        if time <= pivot:
            i += 1
        else:
            break
    return regimes[i-1]

pt = []
pr = []

with open('paris.csv') as csv_file:
    csv_reader = csv.reader(csv_file, delimiter=',')
    next(csv_file)
    for row in csv_reader:
        pt.append(date.strptime(row[0]))
        pr.append(row[1])

def paris(year=1945, month=1, day=1):
    print( latest(pt, pr, date(1, year, month, day) ) )


