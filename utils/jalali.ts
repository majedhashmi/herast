// Simple Jalali (Shamsi) calendar utility functions

export const jalaliMonthNames = [
  "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
  "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

export const toPersianDigits = (n: number | string): string => {
    if (n === null || n === undefined) return '';
    return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d, 10)]);
};

function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + (Math.floor((gy2 + 3) / 4)) - (Math.floor((gy2 + 99) / 100)) + (Math.floor((gy2 + 399) / 400)) - 80 + gd + g_d_m[gm - 1];
  jy += 621;
  jy += 33 * (Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * (Math.floor(days / 1461));
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return [jy, jm, jd];
}

export function getJalaliDate(date: Date) {
  const [year, month, day] = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return { year, month, day };
}

export function isJalaliLeapYear(year: number): boolean {
  const A = 0.025;
  const B = 266;
  let छ;
  if (year > 0)
    छ = 474;
  else
    छ = 473;
  return (((year - छ) % 2820) + B) % 2820 < 682;
}


export function getDaysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) {
    return 31;
  }
  if (month <= 11) {
    return 30;
  }
  return isJalaliLeapYear(year) ? 30 : 29;
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): [number, number, number] {
    jy -= 979;
    let days = (365 * jy) + (Math.floor(jy / 33) * 8) + (Math.floor(((jy % 33) + 3) / 4)) + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
    let gy = 1600 + 400 * (Math.floor(days / 146097));
    days %= 146097;
    let leap = 1;
    if (days >= 36525) {
        days--;
        gy += 100 * (Math.floor(days / 36524));
        days %= 36524;
        if (days >= 365) days++; else leap = 0;
    }
    gy += 4 * (Math.floor(days / 1461));
    days %= 1461;
    if (days > 365) {
        gy += Math.floor((days - 1) / 365);
        days = (days - 1) % 365;
    }
    const gd = days + 1;
    const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    let gm = 0;
    while (gm < 13 && gd > sal_a[gm]) {
        gm++;
    }
    return [gy, gm, gd - sal_a[gm-1]];
}

export function getFirstDayOfMonth(year: number, month: number): number {
    const [gy, gm, gd] = jalaliToGregorian(year, month, 1);
    const date = new Date(gy, gm - 1, gd);
    return (date.getDay() + 1) % 7; // 0: Sat, 1: Sun, ...
}

export const formatJalaliDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12) return dateStr;

  const monthName = jalaliMonthNames[month - 1];
  
  return `${toPersianDigits(day)} ${monthName} ${toPersianDigits(year)}`;
};

/**
 * Gets today's Jalali date as a formatted string.
 * @returns Today's date in YYYY/MM/DD format.
 */
export function getTodayJalaliString(): string {
  const today = getJalaliDate(new Date());
  return `${today.year}/${String(today.month).padStart(2, '0')}/${String(today.day).padStart(2, '0')}`;
}

/**
 * Adds a number of days to a Jalali date string and returns the new Jalali date string.
 * @param dateStr Jalali date string in YYYY/MM/DD format.
 * @param daysToAdd Number of days to add.
 * @returns New Jalali date string in YYYY/MM/DD format.
 */
export function addDaysJalali(dateStr: string, daysToAdd: number): string {
  const [jy, jm, jd] = dateStr.split('/').map(Number);
  const [gy, gm, gd] = jalaliToGregorian(jy, jm, jd);

  const gregorianDate = new Date(gy, gm - 1, gd);
  gregorianDate.setDate(gregorianDate.getDate() + daysToAdd);

  const [newJy, newJm, newJd] = gregorianToJalali(gregorianDate.getFullYear(), gregorianDate.getMonth() + 1, gregorianDate.getDate());
  return `${newJy}/${String(newJm).padStart(2, '0')}/${String(newJd).padStart(2, '0')}`;
}
