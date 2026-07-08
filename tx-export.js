const EXPORT_TX_BATCH_SIZE = 25;
const EXPORT_FETCH_TIMEOUT_MS = 20000;
const EXPORT_FETCH_MAX_RETRIES = 10;
const EXPORT_FETCH_RETRY_BASE_MS = 1500;
const EXPORT_FETCH_BATCH_DELAY_MS = 300;

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getExportRetryDelayMs(attempt, err) {
  const message = String(err?.message || err || "");
  const isRateLimited =
    message.includes("429") ||
    message.includes("503") ||
    message.includes("502") ||
    message.toLowerCase().includes("rate");
  const base = isRateLimited
    ? EXPORT_FETCH_RETRY_BASE_MS * 4
    : EXPORT_FETCH_RETRY_BASE_MS;
  return base * 2 ** attempt;
}

async function fetchWithExportRetry(
  task,
  { label = "export fetch", onRetry, maxRetries = EXPORT_FETCH_MAX_RETRIES } = {},
) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await task();
    } catch (err) {
      lastError = err;
      if (attempt >= maxRetries) break;

      const delayMs = getExportRetryDelayMs(attempt, err);
      onRetry?.(attempt + 1, maxRetries, delayMs, err);
      console.warn(
        `[tx-export] ${label} failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delayMs}ms:`,
        err,
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

function getExportColumns() {
  return [
    t("exportColTxId"),
    t("exportColConfirmedTs"),
    t("exportColType"),
    t("exportColAmount"),
    t("exportColFee"),
    t("exportColBlockHeight"),
    t("exportColInputsCount"),
    t("exportColOutputsCount"),
  ];
}

function formatUtcDateTime(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getUTCFullYear(),
    pad2(date.getUTCMonth() + 1),
    pad2(date.getUTCDate()),
  ].join("-") +
    " " +
    [
      pad2(date.getUTCHours()),
      pad2(date.getUTCMinutes()),
      pad2(date.getUTCSeconds()),
    ].join(":");
}

function outputMatchesTarget(output, watchTarget) {
  if (!output) return false;

  if (watchTarget.mode === "pubkey") {
    const scriptPubKey = (output.scriptpubkey || "").toLowerCase();
    return scriptPubKey === watchTarget.scriptPubKey.toLowerCase();
  }

  const address = output.scriptpubkey_address;
  return (
    typeof address === "string" &&
    address.toLowerCase() === watchTarget.displayValue.toLowerCase()
  );
}

function calcAddressNetSats(tx, watchTarget) {
  let received = 0;
  let sent = 0;

  for (const vout of tx.vout || []) {
    if (outputMatchesTarget(vout, watchTarget)) {
      received += Number(vout.value) || 0;
    }
  }

  for (const vin of tx.vin || []) {
    if (vin.is_coinbase) continue;
    if (outputMatchesTarget(vin.prevout, watchTarget)) {
      sent += Number(vin.prevout?.value) || 0;
    }
  }

  return received - sent;
}

function showExportOverlay() {
  hideActionMenu();
  setExportProgress(0, t("exportGenerating"), "");
  AppDom.exportOverlay.hidden = false;
  AppDom.exportOverlay.setAttribute("aria-busy", "true");
}

function hideExportOverlay() {
  AppDom.exportOverlay.hidden = true;
  AppDom.exportOverlay.setAttribute("aria-busy", "false");
  setExportProgress(0, "", "");
}

async function createExportSnapshot(txCount) {
  let blockHeight = Number(AppState.cachedBlockHeight);

  try {
    const heightText = await fetchMempoolText("/blocks/tip/height", {
      validate: (value) => /^\d+$/.test(value),
      timeoutMs: EXPORT_FETCH_TIMEOUT_MS,
    });
    blockHeight = Number(heightText);
  } catch (err) {
    console.warn(
      "[tx-export] could not refresh block height for snapshot, using cached:",
      err,
    );
  }

  return {
    blockHeight: Number.isFinite(blockHeight) ? blockHeight : null,
    blockTimeSec: Math.floor(Date.now() / 1000),
    txCount: Math.max(0, Number(txCount) || 0),
  };
}

function isTxWithinExportSnapshot(tx, snapshot) {
  if (!tx?.txid || !tx?.status?.confirmed) return false;

  const blockHeight = Number(tx.status.block_height);
  if (
    snapshot.blockHeight != null &&
    Number.isFinite(blockHeight) &&
    blockHeight > snapshot.blockHeight
  ) {
    return false;
  }

  const blockTime = Number(tx.status.block_time);
  if (
    snapshot.blockTimeSec != null &&
    Number.isFinite(blockTime) &&
    blockTime > snapshot.blockTimeSec
  ) {
    return false;
  }

  return true;
}

function setExportProgress(percent, phaseText, detailText = "") {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const percentLabel = `${clamped}%`;

  if (AppDom.exportOverlayPhase) {
    AppDom.exportOverlayPhase.textContent = phaseText || "";
  }

  if (AppDom.exportProgressDetail) {
    AppDom.exportProgressDetail.textContent = detailText || "";
  }

  AppDom.exportProgressBar.style.width = `${clamped}%`;

  if (AppDom.exportProgressPercent) {
    AppDom.exportProgressPercent.textContent = percentLabel;
  }

  if (AppDom.exportProgressTrack) {
    AppDom.exportProgressTrack.setAttribute("aria-valuenow", String(clamped));
    AppDom.exportProgressTrack.setAttribute(
      "aria-valuetext",
      detailText ? `${phaseText} — ${detailText} (${percentLabel})` : percentLabel,
    );
  }
}

async function fetchAllChainTxs(
  apiBasePath,
  queryKey,
  snapshot,
  onBatchLoaded,
  onRetry,
) {
  const encodedQueryKey = encodeURIComponent(queryKey);
  const seenTxids = new Set();
  const allTxs = [];
  let lastTxid = null;
  const maxCount = snapshot?.txCount;

  while (true) {
    if (maxCount != null && allTxs.length >= maxCount) break;

    const path = lastTxid
      ? `/${apiBasePath}/${encodedQueryKey}/txs/chain/${encodeURIComponent(lastTxid)}`
      : `/${apiBasePath}/${encodedQueryKey}/txs/chain`;

    const batch = await fetchWithExportRetry(
      () =>
        fetchMempoolJson(path, {
          timeoutMs: EXPORT_FETCH_TIMEOUT_MS,
        }),
      {
        label: "chain transactions",
        onRetry: (attempt, maxRetries, delayMs, err) => {
          onRetry?.({
            attempt,
            maxRetries,
            delayMs,
            loadedCount: allTxs.length,
            err,
          });
        },
      },
    );

    if (!Array.isArray(batch) || batch.length === 0) break;

    for (const tx of batch) {
      if (maxCount != null && allTxs.length >= maxCount) break;
      if (!tx?.txid || seenTxids.has(tx.txid)) continue;
      if (!isTxWithinExportSnapshot(tx, snapshot)) continue;

      seenTxids.add(tx.txid);
      allTxs.push(tx);
    }
    onBatchLoaded?.(allTxs.length);

    if (maxCount != null && allTxs.length >= maxCount) break;
    if (batch.length < EXPORT_TX_BATCH_SIZE) break;
    lastTxid = batch[batch.length - 1]?.txid;
    if (!lastTxid) break;

    if (EXPORT_FETCH_BATCH_DELAY_MS > 0) {
      await sleep(EXPORT_FETCH_BATCH_DELAY_MS);
    }
  }

  return allTxs;
}

function buildTransactionRow(tx, watchTarget) {
  const confirmed = Boolean(tx?.status?.confirmed);
  const netSats = calcAddressNetSats(tx, watchTarget);
  const type = netSats >= 0 ? t("exportTypeReceived") : t("exportTypeSent");
  const feeSats = Number(tx?.fee);
  const blockTime = confirmed ? Number(tx.status.block_time) : null;
  const confirmedDate =
    confirmed && Number.isFinite(blockTime) && blockTime > 0
      ? new Date(blockTime * 1000)
      : null;

  return [
    tx.txid,
    confirmedDate ? formatUtcDateTime(confirmedDate) : t("na"),
    type,
    satsToBtc(netSats),
    Number.isFinite(feeSats) ? satsToBtc(feeSats) : "",
    confirmed && Number.isFinite(Number(tx.status.block_height))
      ? Number(tx.status.block_height)
      : "",
    Array.isArray(tx.vin) ? tx.vin.length : 0,
    Array.isArray(tx.vout) ? tx.vout.length : 0,
  ];
}

function sanitizeFilenamePart(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 48);
}

async function buildExportWorkbook(rows, summary) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = t("pageHeading");
  workbook.created = new Date();

  const receivedLabel = t("exportTypeReceived");
  const sentLabel = t("exportTypeSent");

  const txSheet = workbook.addWorksheet(t("exportSheetTransactions"), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  txSheet.addRow(getExportColumns());
  const headerRow = txSheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };

  rows.forEach((row) => txSheet.addRow(row));

  const lastRow = rows.length + 1;
  if (lastRow > 1) {
    txSheet.addConditionalFormatting({
      ref: `C2:C${lastRow}`,
      rules: [
        {
          type: "expression",
          priority: 1,
          formulae: [`=$C2="${receivedLabel}"`],
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFC6EFCE" },
            },
          },
        },
        {
          type: "expression",
          priority: 2,
          formulae: [`=$C2="${sentLabel}"`],
          style: {
            fill: {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFC7CE" },
            },
          },
        },
      ],
    });
  }

  txSheet.columns = [
    { width: 68 },
    { width: 24 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  for (let rowIndex = 2; rowIndex <= lastRow; rowIndex += 1) {
    txSheet.getCell(`D${rowIndex}`).numFmt = "0.00000000";
    txSheet.getCell(`E${rowIndex}`).numFmt = "0.00000000";
  }

  const summarySheet = workbook.addWorksheet(t("exportSheetSummary"));
  summarySheet.columns = [{ width: 28 }, { width: 56 }];

  const summaryRows = [
    [summary.addressLabel, summary.address],
    [t("exportSummaryTotalTxs"), summary.totalTransactions],
    [t("exportSummaryTotalReceived"), summary.totalReceivedBtc],
    [t("exportSummaryTotalSent"), summary.totalSentBtc],
    [t("exportSummaryBalance"), summary.currentBalanceBtc],
  ];

  summaryRows.forEach(([label, value], index) => {
    const row = summarySheet.addRow([label, value]);
    if (index === 0) {
      row.getCell(1).font = { bold: true };
    }
  });

  summarySheet.getCell("B2").numFmt = "0";
  summarySheet.getCell("B3").numFmt = "0.00000000";
  summarySheet.getCell("B4").numFmt = "0.00000000";
  summarySheet.getCell("B5").numFmt = "0.00000000";

  summarySheet.addRow([]);
  const noteRowNumber = summarySheet.lastRow.number + 1;
  summarySheet.addRow([t("exportSummaryNote")]);
  summarySheet.mergeCells(`A${noteRowNumber}:B${noteRowNumber}`);
  const noteCell = summarySheet.getCell(`A${noteRowNumber}`);
  noteCell.alignment = { wrapText: true, vertical: "top" };
  noteCell.font = { italic: true, size: 10 };
  summarySheet.getRow(noteRowNumber).height = 72;

  return workbook;
}

function downloadWorkbook(workbook, filename) {
  return workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

function showExportError(message) {
  AppDom.errorEl.textContent = message;
  AppDom.errorEl.classList.add("show");
}

async function exportAddressTransactions() {
  if (!AppState.lastAppliedData || !AppState.currentLookupInput) {
    showExportError(t("errorExportNoAddress"));
    return;
  }

  if (typeof ExcelJS === "undefined") {
    showExportError(t("errorExportLibrary"));
    return;
  }

  const exportBtn = AppDom.actionExportBtn;
  exportBtn.disabled = true;
  clearError();
  showExportOverlay();

  try {
    const applied = AppState.lastAppliedData;
    const watchTarget = applied.watchTarget;
    const apiBasePath = watchTarget.mode === "pubkey" ? "scripthash" : "address";

    const snapshot = await createExportSnapshot(applied.txCount);
    const totalTxCount = snapshot.txCount;
    const progressTotal = Math.max(totalTxCount, 1);

    setExportProgress(
      4,
      t("exportPhaseFetchingTxs"),
      t("exportProgressTxs", { done: 0, total: totalTxCount }),
    );

    const allTxs = await fetchAllChainTxs(
      apiBasePath,
      watchTarget.queryKey,
      snapshot,
      (loadedCount) => {
        const done = Math.min(loadedCount, progressTotal);
        const pct = 4 + Math.min(80, (done / progressTotal) * 80);
        setExportProgress(
          pct,
          t("exportPhaseFetchingTxs"),
          t("exportProgressTxs", {
            done: totalTxCount ? Math.min(loadedCount, totalTxCount) : loadedCount,
            total: totalTxCount,
          }),
        );
      },
      ({ attempt, maxRetries, loadedCount }) => {
        setExportProgress(
          4 + Math.min(80, (Math.min(loadedCount, progressTotal) / progressTotal) * 80),
          t("exportPhaseRetrying"),
          t("exportProgressRetry", {
            attempt,
            maxRetries,
            done: loadedCount,
          }),
        );
      },
    );

    if (allTxs.length === 0) {
      showExportError(t("errorExportEmpty"));
      return;
    }

    const txTotal = allTxs.length;

    setExportProgress(
      84,
      t("exportPhaseFetchingTxs"),
      t("exportProgressTxs", { done: txTotal, total: txTotal }),
    );

    const rows = allTxs.map((tx) => buildTransactionRow(tx, watchTarget));

    let totalReceivedSats = 0;
    let totalSentSats = 0;

    rows.forEach((row) => {
      const amountBtc = Number(row[3]);
      if (!Number.isFinite(amountBtc)) return;
      if (amountBtc >= 0) {
        totalReceivedSats += Math.round(amountBtc * AppConstants.SATS_PER_BTC);
      } else {
        totalSentSats += Math.abs(
          Math.round(amountBtc * AppConstants.SATS_PER_BTC),
        );
      }
    });

    const summary = {
      addressLabel:
        watchTarget.mode === "pubkey"
          ? t("exportSummaryPublicKey")
          : t("exportSummaryAddress"),
      address: watchTarget.displayValue,
      totalTransactions: allTxs.length,
      totalReceivedBtc: satsToBtc(totalReceivedSats),
      totalSentBtc: satsToBtc(totalSentSats),
      currentBalanceBtc: applied.confirmedBtc,
    };

    setExportProgress(
      86,
      t("exportPhaseBuilding"),
      t("exportProgressBuilding", { done: txTotal, total: txTotal }),
    );
    const workbook = await buildExportWorkbook(rows, summary);

    setExportProgress(
      96,
      t("exportPhaseDownloading"),
      t("exportProgressDownloading", { total: txTotal }),
    );
    const stamp = formatUtcDateTime(new Date()).replace(/[:\s]/g, "-");
    const filename = `bitcoin-txs-${sanitizeFilenamePart(watchTarget.displayValue)}-${stamp}.xlsx`;
    await downloadWorkbook(workbook, filename);
    setExportProgress(
      100,
      t("exportPhaseDownloading"),
      t("exportProgressDownloading", { total: txTotal }),
    );
  } catch (err) {
    console.error(err);
    showExportError(t("errorExportFetch"));
  } finally {
    hideExportOverlay();
    exportBtn.disabled = false;
  }
}

window.hideExportOverlay = hideExportOverlay;
window.exportAddressTransactions = exportAddressTransactions;