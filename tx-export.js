const EXPORT_TX_BATCH_SIZE = 25;
const EXPORT_FIRST_SEEN_BATCH_SIZE = 50;

function getExportColumns() {
  return [
    t("exportColTxId"),
    t("exportColMempoolTs"),
    t("exportColConfirmedTs"),
    t("exportColConfirmationTime"),
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

async function fetchAllChainTxs(apiBasePath, queryKey, onBatchLoaded) {
  const encodedQueryKey = encodeURIComponent(queryKey);
  const allTxs = [];
  let lastTxid = null;

  while (true) {
    const path = lastTxid
      ? `/${apiBasePath}/${encodedQueryKey}/txs/chain/${encodeURIComponent(lastTxid)}`
      : `/${apiBasePath}/${encodedQueryKey}/txs/chain`;

    const batch = await fetchMempoolJson(path);
    if (!Array.isArray(batch) || batch.length === 0) break;

    allTxs.push(...batch);
    onBatchLoaded?.(allTxs.length);

    if (batch.length < EXPORT_TX_BATCH_SIZE) break;
    lastTxid = batch[batch.length - 1]?.txid;
    if (!lastTxid) break;
  }

  return allTxs;
}

async function fetchMempoolTransactionTimesBatch(txids) {
  if (!txids.length) return [];

  const query = txids
    .map((txid) => `txId[]=${encodeURIComponent(txid)}`)
    .join("&");

  const data = await fetchMempoolOnlyJson(`/v1/transaction-times?${query}`, {
    validate: (payload) => Array.isArray(payload),
  });

  return data;
}

async function fetchFirstSeenMap(allTxs, onProgress) {
  const firstSeenMap = new Map();
  const txids = allTxs.map((tx) => tx.txid);

  for (let index = 0; index < txids.length; index += EXPORT_FIRST_SEEN_BATCH_SIZE) {
    const batch = txids.slice(index, index + EXPORT_FIRST_SEEN_BATCH_SIZE);
    try {
      const timestamps = await fetchMempoolTransactionTimesBatch(batch);
      batch.forEach((txid, batchIndex) => {
        const timestamp = Number(timestamps[batchIndex]);
        if (Number.isFinite(timestamp) && timestamp > 0) {
          firstSeenMap.set(txid, timestamp);
        }
      });
    } catch (err) {
      console.warn("[tx-export] first-seen batch failed:", err);
    }
  }

  const missingTxs = allTxs.filter((tx) => !firstSeenMap.has(tx.txid));
  let resolved = allTxs.length - missingTxs.length;
  onProgress?.(resolved, allTxs.length);

  for (const tx of missingTxs) {
    const timestamp = await fetchTxFirstSeen(tx.txid, tx);
    if (Number.isFinite(timestamp) && timestamp > 0) {
      firstSeenMap.set(tx.txid, timestamp);
    }

    resolved += 1;
    onProgress?.(resolved, allTxs.length);
  }

  return firstSeenMap;
}

function buildTransactionRow(tx, watchTarget, firstSeenTs) {
  const confirmed = Boolean(tx?.status?.confirmed);
  const netSats = calcAddressNetSats(tx, watchTarget);
  const type = netSats >= 0 ? t("exportTypeReceived") : t("exportTypeSent");
  const feeSats = Number(tx?.fee);
  const blockTime = confirmed ? Number(tx.status.block_time) : null;
  const firstSeenDate =
    Number.isFinite(firstSeenTs) && firstSeenTs > 0
      ? new Date(firstSeenTs * 1000)
      : null;
  const confirmedDate =
    confirmed && Number.isFinite(blockTime) && blockTime > 0
      ? new Date(blockTime * 1000)
      : null;

  return [
    tx.txid,
    firstSeenDate ? formatUtcDateTime(firstSeenDate) : t("na"),
    confirmedDate ? formatUtcDateTime(confirmedDate) : t("na"),
    confirmed
      ? formatTimeFromFirstSeenToConfirmed(firstSeenDate, confirmedDate)
      : t("na"),
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
      ref: `E2:E${lastRow}`,
      rules: [
        {
          type: "expression",
          priority: 1,
          formulae: [`=$E2="${receivedLabel}"`],
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
          formulae: [`=$E2="${sentLabel}"`],
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
    { width: 24 },
    { width: 22 },
    { width: 12 },
    { width: 16 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
  ];

  for (let rowIndex = 2; rowIndex <= lastRow; rowIndex += 1) {
    txSheet.getCell(`F${rowIndex}`).numFmt = "0.00000000";
    txSheet.getCell(`G${rowIndex}`).numFmt = "0.00000000";
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
    const totalTxCount = Number(applied.txCount) || 0;
    const progressTotal = Math.max(totalTxCount, 1);

    setExportProgress(
      4,
      t("exportPhaseFetchingTxs"),
      t("exportProgressTxs", { done: 0, total: totalTxCount }),
    );

    const chainTxs = await fetchAllChainTxs(
      apiBasePath,
      watchTarget.queryKey,
      (loadedCount) => {
        const done = Math.min(loadedCount, progressTotal);
        const pct = 4 + Math.min(26, (done / progressTotal) * 26);
        setExportProgress(
          pct,
          t("exportPhaseFetchingTxs"),
          t("exportProgressTxs", {
            done: totalTxCount ? Math.min(loadedCount, totalTxCount) : loadedCount,
            total: totalTxCount,
          }),
        );
      },
    );

    const allTxs = (chainTxs || []).filter(
      (tx) => tx?.txid && tx?.status?.confirmed,
    );

    if (allTxs.length === 0) {
      showExportError(t("errorExportEmpty"));
      return;
    }

    const txTotal = allTxs.length;

    setExportProgress(
      30,
      t("exportPhaseFetchingTxs"),
      t("exportProgressTxs", { done: txTotal, total: txTotal }),
    );

    setExportProgress(
      32,
      t("exportPhaseFetchingTimes"),
      t("exportProgressTimes", { done: 0, total: txTotal }),
    );

    const firstSeenMap = await fetchFirstSeenMap(allTxs, (done, total) => {
      const pct = 32 + ((done / total) * 52);
      setExportProgress(
        pct,
        t("exportPhaseFetchingTimes"),
        t("exportProgressTimes", { done, total }),
      );
    });

    const rows = allTxs.map((tx) =>
      buildTransactionRow(tx, watchTarget, firstSeenMap.get(tx.txid)),
    );

    let totalReceivedSats = 0;
    let totalSentSats = 0;

    rows.forEach((row) => {
      const amountBtc = Number(row[5]);
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
      88,
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