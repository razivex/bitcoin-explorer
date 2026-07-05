function pad2(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function satsToBtc(sats) {
  return sats / AppConstants.SATS_PER_BTC;
}

function formatBtc(btc) {
  return btc.toLocaleString(getLocale(), {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
  });
}

function formatFiat(value) {
  return value.toLocaleString(getLocale(), {
    style: "currency",
    currency: getDisplayCurrency(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDateTime(date) {
  const day = pad2(date.getDate());
  const month = pad2(date.getMonth() + 1);
  const year = date.getFullYear();
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());

  if (getCurrentLang() === "pt-BR") {
    return `${day}/${month}/${year} ${pad2(date.getHours())}:${minutes}:${seconds}`;
  }

  let hours = date.getHours();
  const ampm = hours >= 12 ? t("pm") : t("am");
  hours = hours % 12 || 12;

  return `${day}/${month}/${year} ${pad2(hours)}:${minutes}:${seconds} ${ampm}`;
}

function getTimeSinceParts(fromDate, toDate = new Date()) {
  let years = toDate.getFullYear() - fromDate.getFullYear();
  let months = toDate.getMonth() - fromDate.getMonth();
  let days = toDate.getDate() - fromDate.getDate();
  let hours = toDate.getHours() - fromDate.getHours();
  let minutes = toDate.getMinutes() - fromDate.getMinutes();
  let seconds = toDate.getSeconds() - fromDate.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes -= 1;
  }
  if (minutes < 0) {
    minutes += 60;
    hours -= 1;
  }
  if (hours < 0) {
    hours += 24;
    days -= 1;
  }
  if (days < 0) {
    const previousMonth = new Date(toDate.getFullYear(), toDate.getMonth(), 0);
    days += previousMonth.getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  return { years, months, days, hours, minutes, seconds };
}

function formatTimeSince(parts) {
  const units = [
    ["unitYear", "unitYears", parts.years],
    ["unitMonth", "unitMonths", parts.months],
    ["unitDay", "unitDays", parts.days],
    ["unitHour", "unitHours", parts.hours],
    ["unitMinute", "unitMinutes", parts.minutes],
    ["unitSecond", "unitSeconds", parts.seconds],
  ];

  const tierStart = units.findIndex(([, , value]) => value > 0);
  if (tierStart === -1) return t("zeroSeconds");

  const formatUnit = ([singular, plural, value]) =>
    `${value} ${value === 1 ? t(singular) : t(plural)}`;

  if (tierStart >= units.length - 1) {
    return formatUnit(units[tierStart]);
  }

  return units
    .slice(tierStart, tierStart + 2)
    .map(formatUnit)
    .join(" ");
}

function truncateMiddle(text, visibleChars) {
  if (text.length <= visibleChars) return text;

  const ellipsis = "...";
  const keep = visibleChars - ellipsis.length;
  const start = Math.ceil(keep / 2);
  const end = Math.floor(keep / 2);
  return `${text.slice(0, start)}${ellipsis}${text.slice(-end)}`;
}

function formatBlockHeight(height) {
  const value = Number(height);
  if (!Number.isFinite(value)) return height;
  return value.toLocaleString(getLocale());
}

function formatMetric(value, decimals = 2) {
  if (value === null || value === undefined || value === "") return t("na");

  const num = Number(value);
  if (!Number.isFinite(num)) return t("na");

  return num.toLocaleString(getLocale(), {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const AMOUNT_SHORTENER_UNITS = [
  { value: 1, symbol: "" },
  { value: 1e3, symbol: "k" },
  { value: 1e6, symbol: "M" },
  { value: 1e9, symbol: "G" },
  { value: 1e12, symbol: "T" },
  { value: 1e15, symbol: "P" },
  { value: 1e18, symbol: "E" },
  { value: 1e21, symbol: "Z" },
  { value: 1e24, symbol: "Y" },
];

function amountShortener(num, digits = 1, unit, sigfigs = false) {
  const value = Number(num);
  if (!Number.isFinite(value) || value <= 0) return t("na");

  if (value < 1000) {
    const formattedNum = sigfigs
      ? Number(value.toPrecision(digits)).toString()
      : Number(value.toFixed(digits)).toString();

    return unit !== undefined ? `${formattedNum} ${unit}` : formattedNum;
  }

  const item = [...AMOUNT_SHORTENER_UNITS]
    .reverse()
    .find((entry) => value >= entry.value);

  if (!item) return "0";

  const scaledNum = value / item.value;
  const formattedNum = sigfigs
    ? Number(scaledNum.toPrecision(digits)).toString()
    : Number(scaledNum.toFixed(digits)).toString();

  if (unit !== undefined) {
    return `${formattedNum} ${item.symbol}${unit}`;
  }

  return `${formattedNum}${item.symbol}`;
}

function formatHashrate(hashrateHs) {
  return amountShortener(hashrateHs, 2, "H/s");
}

function formatNetworkDifficulty(difficulty) {
  return amountShortener(difficulty, 2);
}

window.pad2 = pad2;
window.satsToBtc = satsToBtc;
window.formatBtc = formatBtc;
window.formatFiat = formatFiat;
window.formatDateTime = formatDateTime;
window.getTimeSinceParts = getTimeSinceParts;
window.formatTimeSince = formatTimeSince;
window.truncateMiddle = truncateMiddle;
window.formatBlockHeight = formatBlockHeight;
window.formatMetric = formatMetric;
window.amountShortener = amountShortener;
window.formatHashrate = formatHashrate;
window.formatNetworkDifficulty = formatNetworkDifficulty;