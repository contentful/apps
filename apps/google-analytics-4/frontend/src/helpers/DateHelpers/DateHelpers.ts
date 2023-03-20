const monthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const parseDayAndMonth = (date: string) => {
  const month = date.substring(4, 6);
  const day = date.substring(6, 8);

  return { month: monthNames[Number(month) - 1], day };
};
