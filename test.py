import csv
import datetime

def year(n):
    return datetime.datetime(n, 1, 1)

def month(n1, n2):
    return datetime.datetime(n1, n2, 1)

def date(n1, n2, n3):
    return datetime.datetime(n1, n2, n3)

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
        pt.append(datetime.datetime.strptime(row[0], '%Y/%m/%d'))
        pr.append(row[1])

def paris(year=1945, month=1, day=1):
    print( latest(pt, pr, date(year, month, day) ) )


