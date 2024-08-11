const MS_PER_DAY: number = 1000 * 60 * 60 * 24;

function getWeek(date: Date) {
    const d: Date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    const yearStart: Date = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getUTCMilliseconds() - yearStart.getUTCMilliseconds()) / 86400000) + 1) / 7);
}

function getMinAndMax(dates: string[]) {
    let result: any = {};
    for (const index in dates) {
        const thisDate: string = dates[index];
        const dateParts: string[] = thisDate.split(/\//);
        const fullDate: Date = new Date(Number(dateParts[2]), Number(dateParts[0]) - 1, Number(dateParts[1]));
        if (!result['max'] || fullDate > result['max']) {
            result['max'] = fullDate;
        }
        if (!result['min'] || fullDate < result['min']) {
            result['min'] = fullDate
        }
    }

    return result;
}


export function convertDateToUTC(date: Date): Date {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

export function dateDiffInDays(a: Date, b: Date): number {
    // discard the time and time-zone information.
    const utc1: Date = convertDateToUTC(a);
    const utc2: Date = convertDateToUTC(b);

    return Math.floor((utc2.getUTCMilliseconds() - utc1.getUTCMilliseconds()) / MS_PER_DAY);
}

export function getSecondOfDay(date: Date): number {
    return date.getSeconds() + (60 * (date.getMinutes() + (60 * date.getHours())))
}

export function getSecondOfDayUTC(date: Date): number {
    return date.getUTCSeconds() + (60 * (date.getUTCMinutes() + (60 * date.getUTCHours())))
}

export function getTriggerExportTimeWithoutDay(time: Date) {
    const date: Date = convertDateToUTC(new Date())
    date.setUTCHours(time.getUTCHours())
    date.setUTCMinutes(time.getUTCMinutes())
    date.setUTCSeconds(0)
    return date;
}

export function convertDateToLocal(date: Date) {
    date = new Date(date)
    return date;
}

export function removeSecondsFromDate(date: Date) {
    date.setUTCSeconds(0)
    date.setUTCMilliseconds(0)
}

export function setDayOfWeekUTC(date: Date, dayOfWeek: number) {
    const dist = dayOfWeek - date.getUTCDay();
    date.setDate(date.getDate() + dist);
}

export function setDayOfWeek(date: Date, dayOfWeek: number) {
    const dist = dayOfWeek - date.getDay();
    date.setDate(date.getDate() + dist);
}

export function setDayOfWeekWithWeeks(date: Date, dayOfWeek: number, weeks: number) {
    if (weeks < 2) {
        setDayOfWeek(date, dayOfWeek);
        return;
    }

    const dist = (dayOfWeek + (7 * weeks) - date.getDay()) % 7;
    date.setDate(date.getDate() + dist);
}

export function isSameweek(a: Date, b: Date) {
    return getWeek(a) === getWeek(b);
}