export const formatTimeTo12Hour = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    if (hours === 0) hours = 12;

    const roundedMinutes = minutes < 30 ? 0 : 30;

    return `${hours}:${String(roundedMinutes).padStart(2, '0')} ${period}`;
  } catch {
    return '';
  }
};

export const parse12HourTimeToDate = (date: Date, timeString: string): Date => {
  const [timePart, period] = timeString.split(' ');
  const [hours, minutes] = timePart.split(':');
  let hour24 = parseInt(hours, 10);

  if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }

  const newDate = new Date(date);
  newDate.setHours(hour24, parseInt(minutes, 10), 0, 0);
  return newDate;
};

export const formatDateTimeWithTimezone = (dateString: string | undefined): string => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return '—';
  }
};

export const formatMonthYear = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export const formatMonthYearDisplay = (monthYear: string): string => {
  const [year, month] = monthYear.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};
