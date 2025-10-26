import React, { useState, useEffect, useRef } from 'react';
import { getJalaliDate, getDaysInJalaliMonth, getFirstDayOfMonth, jalaliMonthNames, jalaliToGregorian } from '../utils/jalali';
import { CalendarIcon } from './Icons';

interface JalaliDatePickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  minDate?: string | null;
  highlightRangeWith?: string | null;
  id?: string;
  'aria-label'?: string;
}

const toPersianDigits = (n: number | string) => n.toString().replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

const JalaliDatePicker: React.FC<JalaliDatePickerProps> = ({ selectedDate, onSelectDate, minDate, highlightRangeWith, id, 'aria-label': customAriaLabel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const initialFocusRef = useRef<HTMLButtonElement>(null);

  const [displayDate, setDisplayDate] = useState(new Date());

  const { year: displayYear, month: displayMonth } = getJalaliDate(displayDate);
  const { year: todayYear, month: todayMonth, day: todayDay } = getJalaliDate(new Date());

  const minGregorianDate = minDate ? (() => {
    const [y, m, d] = minDate.split('/').map(Number);
    const [gy, gm, gd] = jalaliToGregorian(y, m, d);
    // Set to start of the day to avoid time-related issues
    return new Date(gy, gm - 1, gd, 0, 0, 0, 0);
  })() : null;

  const daysInMonth = getDaysInJalaliMonth(displayYear, displayMonth);
  const firstDayOfMonth = getFirstDayOfMonth(displayYear, displayMonth);
  const calendarGrid = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => initialFocusRef.current?.focus(), 0);
    } else {
      triggerRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelectDate = (day: number) => {
    const newDate = `${displayYear}/${String(displayMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    onSelectDate(newDate);
    setIsOpen(false);
  };

  const goToPreviousMonth = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const goToToday = () => {
    const todayJalali = getJalaliDate(new Date());
    const todayDateStr = `${todayJalali.year}/${String(todayJalali.month).padStart(2, '0')}/${String(todayJalali.day).padStart(2, '0')}`;
    
    let isTodayDisabled = false;
    if (minGregorianDate) {
      const [ty, tm, td] = jalaliToGregorian(todayJalali.year, todayJalali.month, todayJalali.day);
      const gregorianToday = new Date(ty, tm - 1, td);
      if (gregorianToday < minGregorianDate) {
        isTodayDisabled = true;
      }
    }
    
    if (!isTodayDisabled) {
      onSelectDate(todayDateStr);
    }
    setDisplayDate(new Date());
    setIsOpen(false);
  }
  
  const defaultAriaLabel = selectedDate ? `تاریخ انتخاب شده: ${selectedDate}` : 'تاریخ را انتخاب کنید';

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        id={id}
        type="button"
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 flex justify-between items-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        aria-expanded={isOpen}
        aria-controls="jalali-datepicker-calendar"
        aria-label={customAriaLabel || defaultAriaLabel}
      >
        <span className={selectedDate ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}>
          {selectedDate ? toPersianDigits(selectedDate) : 'تاریخ را انتخاب کنید'}
        </span>
        <CalendarIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
      </button>

      {isOpen && (
        <div id="jalali-datepicker-calendar" role="grid" className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-10 p-3">
          <div className="flex justify-between items-center mb-2">
            <button type="button" onClick={goToPreviousMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="ماه قبل">&lt;</button>
            <span className="font-semibold" aria-live="polite" aria-atomic="true">{jalaliMonthNames[displayMonth - 1]} {toPersianDigits(displayYear)}</span>
            <button type="button" onClick={goToNextMonth} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700" aria-label="ماه بعد">&gt;</button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400 mb-2" role="row">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map(d => <div key={d} role="columnheader" className="w-8 h-8 flex items-center justify-center">{d}</div>)}
          </div>
          <div className="grid grid-cols-7" role="rowgroup">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} role="gridcell" aria-hidden="true" />)}
            {calendarGrid.map(day => {
                const currentDayStr = `${displayYear}/${String(displayMonth).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
                
                const [gYear, gMonth, gDay] = jalaliToGregorian(displayYear, displayMonth, day);
                const currentDayGregorian = new Date(gYear, gMonth - 1, gDay, 0, 0, 0, 0);

                const isToday = day === todayDay && displayMonth === todayMonth && displayYear === todayYear;
                const isSelected = currentDayStr === selectedDate;
                const isBeforeMinDate = minGregorianDate && currentDayGregorian < minGregorianDate;

                let rangeStartStr: string | null = null;
                let rangeEndStr: string | null = null;
                if (selectedDate && highlightRangeWith) {
                    if (selectedDate.localeCompare(highlightRangeWith) <= 0) {
                        [rangeStartStr, rangeEndStr] = [selectedDate, highlightRangeWith];
                    } else {
                        [rangeStartStr, rangeEndStr] = [highlightRangeWith, selectedDate];
                    }
                }

                const isRangeStart = currentDayStr === rangeStartStr;
                const isRangeEnd = currentDayStr === rangeEndStr;
                const isInRange = rangeStartStr && rangeEndStr && currentDayStr > rangeStartStr && currentDayStr < rangeEndStr;

                const dayClasses = `w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors relative z-10 
                  ${isRangeStart || isRangeEnd || (isSelected && !highlightRangeWith)
                    ? 'bg-indigo-600 text-white'
                    : isToday 
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' 
                        : isBeforeMinDate
                          ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`;

                const rangeBgClasses = `absolute top-0 h-full z-0 
                  ${isInRange ? 'bg-indigo-100 dark:bg-indigo-500/20 left-0 right-0' : ''}
                  ${isRangeStart && rangeEndStr && rangeStartStr !== rangeEndStr ? 'bg-indigo-100 dark:bg-indigo-500/20 left-0 right-1/2 rounded-l-full' : ''}
                  ${isRangeEnd && rangeStartStr && rangeStartStr !== rangeEndStr ? 'bg-indigo-100 dark:bg-indigo-500/20 right-0 left-1/2 rounded-r-full' : ''}
                `;

                return (
                    <div key={day} className="relative h-8 flex justify-center items-center" role="gridcell" aria-selected={isSelected}>
                       <div className={rangeBgClasses}></div>
                        <button
                            type="button"
                            ref={isSelected || isToday ? initialFocusRef : null}
                            onClick={() => handleSelectDate(day)}
                            disabled={isBeforeMinDate}
                            className={dayClasses}
                            aria-label={`انتخاب روز ${day} ${jalaliMonthNames[displayMonth - 1]} ${displayYear}`}
                        >
                            {toPersianDigits(day)}
                        </button>
                    </div>
                );
            })}
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
             <button
                type="button"
                onClick={goToToday}
                className="w-full text-center text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 p-1.5 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                aria-label="امروز"
              >
                امروز
              </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JalaliDatePicker;