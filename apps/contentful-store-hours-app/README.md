# Closing Time

A Contentful App Framework app for managing business hours of operation. Provides a modal UI for content authors to easily set opening and closing times for each day of the week.

## Features

- Visual editor for hours of operation
- Support for multiple time slots per day (e.g., lunch breaks)
- 24-hour operation toggle
- Copy hours to all days or weekdays
- Clean, simple JSON output format

## Installation

```bash
npm install
```

## Development

```bash
npm start
```

This starts the development server at `http://localhost:3000`.

## Building

```bash
npm run build
```

## Contentful Setup

1. Create a new app in your Contentful organization
2. Set the app URL to your hosted app or `http://localhost:3000` for development
3. Enable the "Entry field" location and select "JSON object" as the field type
4. Install the app in your space
5. Add a JSON field to your content type and select this app as the appearance

## JSON Data Format

The app saves hours in the following format (note: use the JSONViewer app in Contentful to visualize the output while in the entry editor):

```json
{
  "monday": {
    "isOpen": true,
    "is24Hours": false,
    "slots": [{ "open": "09:00", "close": "17:00" }]
  },
  "tuesday": {
    "isOpen": true,
    "is24Hours": false,
    "slots": [
      { "open": "09:00", "close": "12:00" },
      { "open": "13:00", "close": "17:00" }
    ]
  },
  "wednesday": {
    "isOpen": true,
    "is24Hours": true,
    "slots": []
  },
  "thursday": {
    "isOpen": true,
    "is24Hours": false,
    "slots": [{ "open": "09:00", "close": "17:00" }]
  },
  "friday": {
    "isOpen": true,
    "is24Hours": false,
    "slots": [{ "open": "09:00", "close": "17:00" }]
  },
  "saturday": {
    "isOpen": false,
    "is24Hours": false,
    "slots": []
  },
  "sunday": {
    "isOpen": false,
    "is24Hours": false,
    "slots": []
  }
}
```

### Field Descriptions

| Field           | Type    | Description                                                    |
| --------------- | ------- | -------------------------------------------------------------- |
| `isOpen`        | boolean | Whether the business is open on this day                       |
| `is24Hours`     | boolean | Whether the business is open 24 hours (ignore `slots` if true) |
| `slots`         | array   | Array of time slot objects                                     |
| `slots[].open`  | string  | Opening time in 24-hour format (HH:MM)                         |
| `slots[].close` | string  | Closing time in 24-hour format (HH:MM)                         |

### Usage Example: Store Hours Table

This example shows how to render the hours data as a store hours table on your website:

```typescript
import type { HoursOfOperation, DayHours } from "./types";

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/**
 * Converts 24-hour time (e.g., "14:30") to 12-hour format (e.g., "2:30 PM")
 */
function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Formats a day's hours into a human-readable string
 */
function formatDayHours(dayHours: DayHours): string {
  if (!dayHours.isOpen) {
    return "Closed";
  }
  if (dayHours.is24Hours) {
    return "Open 24 hours";
  }
  return dayHours.slots
    .map((slot) => `${formatTime(slot.open)} - ${formatTime(slot.close)}`)
    .join(", ");
}

/**
 * React component that renders a store hours table
 */
function StoreHoursTable({ hours }: { hours: HoursOfOperation }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Day</th>
          <th>Hours</th>
        </tr>
      </thead>
      <tbody>
        {DAYS.map((day) => (
          <tr key={day}>
            <td>{DAY_LABELS[day]}</td>
            <td>{formatDayHours(hours[day])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Example output for a restaurant with lunch break:
// | Day       | Hours                           |
// |-----------|---------------------------------|
// | Monday    | 11:00 AM - 2:00 PM, 5:00 PM - 9:00 PM |
// | Tuesday   | 11:00 AM - 2:00 PM, 5:00 PM - 9:00 PM |
// | ...       | ...                             |
// | Sunday    | Closed                          |
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Contentful App SDK
- Forma 36 (Contentful's design system)
