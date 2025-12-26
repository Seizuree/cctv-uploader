export function FormatDate(date: Date | string | null | undefined): string {
  if (!date) return ''

  const d = date instanceof Date ? date : new Date(date)

  if (isNaN(d.getTime())) return ''

  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

export function GetTimestampForFilename(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

export function convertDateToGMT7(newDate: Date) {
  const gmt7Options = {
    timeZone: 'Asia/Bangkok', // Represents GMT+7
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  } as const

  const gmt7Formatter = new Intl.DateTimeFormat('en-US', gmt7Options)
  gmt7Formatter.format(newDate)

  const year = newDate.getFullYear()
  const month = newDate.getMonth() + 1
  const date = newDate.getDate()

  return { year, month, date }
}

/**
 * Get current time in GMT+7
 * @returns {Date} Current date/time in GMT+7
 */
export function getCurrentTimeGMT7(): Date {
  return toGMT7(new Date())
}

/**
 * Add hours to current time in GMT+7
 * @param hours - Number of hours to add
 * @returns {Date} Date/time in GMT+7 with added hours
 */
export function addHoursGMT7(hours: number): Date {
  const hoursInMs = hours * 60 * 60 * 1000
  return toGMT7(new Date(Date.now() + hoursInMs))
}

/**
 * Add minutes to current time in GMT+7
 * @param minutes - Number of minutes to add
 * @returns {Date} Date/time in GMT+7 with added minutes
 */
export function addMinutesGMT7(minutes: number): Date {
  const minutesInMs = minutes * 60 * 1000
  return toGMT7(new Date(Date.now() + minutesInMs))
}

/**
 * Convert any date to GMT+7
 * @param date - Date to convert
 * @returns {Date} Date converted to GMT+7
 */
export function toGMT7(date: Date): Date {
  return new Date(date.getTime() + 7 * 60 * 60 * 1000)
}

/**
 * Get current time (UTC-based, no manual timezone conversion)
 * Use this when comparing with timestamptz columns from PostgreSQL
 * @returns {Date} Current date/time
 */
export function getCurrentTime(): Date {
  return new Date()
}

/**
 * Add hours to current time (UTC-based, no manual timezone conversion)
 * Use this when comparing with timestamptz columns from PostgreSQL
 * @param hours - Number of hours to add (can be negative)
 * @returns {Date} Date/time with added hours
 */
export function addHours(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000)
}

/**
 * Add minutes to current time (UTC-based, no manual timezone conversion)
 * Use this when comparing with timestamptz columns from PostgreSQL
 * @param minutes - Number of minutes to add (can be negative)
 * @returns {Date} Date/time with added minutes
 */
export function addMinutes(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000)
}
