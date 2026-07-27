const LANG_STORAGE_KEY = "bitcoin-explorer-language";
const DEFAULT_LANG = "en";

const translations = {
  en: {
    pageTitle: "Bitcoin Explorer",
    pageHeading: "Bitcoin Explorer",
    pageSub:
      "Real time data explorer for on-chain Bitcoin, Lightning, or Liquid",
    searchLabel: "Check your address, transaction, channel or invoice below:",
    searchPlaceholder: "e.g. bc1q...",
    txId: "Transaction ID:",
    txDate: "First Seen Date:",
    txStatus: "Status:",
    txConfirmed: "Confirmed",
    txUnconfirmed: "Unconfirmed",
    txConfirmedAt: "Confirmed Date:",
    txTimeToConfirmation: "Time to confirmation:",
    txTimeSinceConfirmation: "Time since confirmation:",
    txBackToChannel: "Back to channel",
    txFee: "Fee:",
    txFeeLine: "{rate} sat/vB × {vsize} vB = {fee} sats",
    txEmbeddedData: "Embedded data:",
    txConfirmations: "Confirmations:",
    errorTxFetch:
      "Could not fetch transaction. Check the txid and try again.",
    check: "Check",
    loading: "Loading...",
    actionMenuLabel: "More actions",
    actionMenuExport: "Export transactions to Excel",
    exportLoading: "Exporting...",
    exportGenerating: "Generating file...",
    exportPhaseFetchingTxs: "Fetching transactions...",
    exportProgressTxs: "Transactions: {done} / {total}",
    exportPhaseRetrying: "Connection issue, retrying...",
    exportProgressRetry: "Attempt {attempt} of {maxRetries} — {done} transactions kept",
    exportProgressBuilding: "Rows: {done} / {total}",
    exportProgressDownloading: "File ready: {total} transactions",
    exportPhaseBuilding: "Building spreadsheet...",
    exportPhaseDownloading: "Downloading file...",
    exportSheetTransactions: "Transactions",
    exportSheetSummary: "Summary",
    exportColTxId: "Transaction ID",
    exportColConfirmedTs: "Timestamp Confirmed (UTC)",
    exportColType: "Type",
    exportColAmount: "Amount (BTC)",
    exportColSizeBytes: "Size (bytes)",
    exportColSizeVbytes: "Size (vB)",
    exportColFeeRate: "Fee (sat/vB)",
    exportColFee: "Fee (BTC)",
    exportColBlockHeight: "Block Height",
    exportColInputsCount: "Inputs Count",
    exportColOutputsCount: "Outputs Count",
    exportTypeReceived: "Received",
    exportTypeSent: "Sent",
    exportSummaryAddress: "Bitcoin Address",
    exportSummaryPublicKey: "Public Key",
    exportSummaryTotalTxs: "Total Transactions",
    exportSummaryTotalReceived: "Total Received (BTC)",
    exportSummaryTotalSent: "Total Sent (BTC)",
    exportSummaryBalance: "Current Balance (BTC)",
    exportSummaryNote:
      "Note: Mempool first-seen time is not recorded on the Bitcoin blockchain and is not always available from third-party services. For that reason, it is not included in this export. This file contains only data that is publicly available on the blockchain.",
    qrShow: "Show address QR code",
    qrTitle: "QR code",
    qrCanvasLabel: "Address QR code",
    qrCopyInvoice: "Copy invoice",
    qrCopied: "Copied!",
    lnQrShow: "Show address QR code",
    lnInvoiceShow: "Generate invoice",
    lnInvoiceTitle: "Generate invoice",
    lnInvoiceAmount: "Amount (sats)",
    lnInvoiceAmountHint: "Min {min} · Max {max}",
    lnInvoiceComment: "Comment (optional)",
    lnInvoiceGenerate: "Generate",
    lnInvoiceCancel: "Cancel",
    lnInvoiceQrLabel: "Lightning invoice QR code",
    lnAddress: "Lightning Address:",
    lnDomain: "Domain:",
    lnMinAmount: "Min amount:",
    lnMaxAmount: "Max amount:",
    lnComment: "Comments:",
    lnCommentAllowed: "Up to {max} characters",
    lnNoDescription: "Lightning Address",
    lnChannelId: "Channel ID:",
    lnChannelFullId: "Full ID:",
    lnCapacity: "Capacity:",
    lnCreated: "Created:",
    lnUpdated: "Updated:",
    lnNodeLeft: "Node A:",
    lnNodeRight: "Node B:",
    lnFundingTx: "Funding TX:",
    lnClosingTx: "Closing TX:",
    lnChannelStatusOpen: "Open",
    lnChannelStatusClosed: "Closed",
    lnInvoiceLabel: "Invoice:",
    lnInvoiceAmountLabel: "Amount:",
    lnInvoiceDescription: "Description:",
    lnInvoiceDestination: "Destination node:",
    lnInvoicePaymentHash: "Payment hash:",
    lnInvoiceCreated: "Creation time:",
    lnInvoiceExpires: "Expire date:",
    lnInvoiceAnyAmount: "Any amount",
    lnInvoiceStatusValid: "Valid",
    lnInvoiceStatusExpired: "Expired",
    lnInvoiceNoDescription: "No description",
    unitSats: "sats",
    networkLightning: "Lightning",
    address: "Address:",
    publicKey: "Public Key:",
    network: "Network:",
    networkBitcoin: "Bitcoin",
    networkLiquid: "Liquid",
    addressType: "Address Type:",
    exposedPubKey: "Exposed PubKey:",
    transactions: "Transactions:",
    lastTxDate: "Last Transaction Date:",
    timeSinceLast: "Time Since Last Transaction:",
    footerCreatedBy: "Created by",
    navHome: "Home",
    navStats: "Stats",
    navNetwork: "Network",
    navValuation: "Valuation",
    blockHeight: "Height: {height}",
    bitcoinPrice: "Price: {value}",
    blocksToDifficulty: "Difficult Adjustment: {blocks}",
    blocksToHalving: "Halving: {blocks}",
    totalSupply: "Supply: {amount} BTC",
    hashrate: "Hash Rate: {value}",
    networkDifficulty: "Difficulty: {value}",
    mayerMultiple: "Mayer Multiple: {value}",
    mvrvRatio: "MVRV Ratio: {value}",
    fearGreedIndex: "Fear & Greed: {value}",
    fearGreedExtremeFear: "Extreme Fear",
    fearGreedFear: "Fear",
    fearGreedNeutral: "Neutral",
    fearGreedGreed: "Greed",
    fearGreedExtremeGreed: "Extreme Greed",
    socialLinks: "Social links",
    language: "Language",
    muteSounds: "Mute sounds",
    unmuteSounds: "Unmute sounds",
    soundsOn: "Sounds on",
    soundsOff: "Sounds off",
    errorEmpty:
      "Please enter a Bitcoin or Liquid address, public key, transaction ID, Lightning channel, Lightning address, or Lightning invoice.",
    errorInvalidPubkey:
      "Invalid public key. Paste a compressed (02/03...) or uncompressed (04...) key in hex.",
    errorFetch:
      "Could not fetch balance. Check the address or public key and try again.",
    errorLnChannelFetch:
      "Could not fetch Lightning channel. Check the channel ID and try again.",
    errorLnAddressFetch:
      "Could not fetch Lightning address. Check the address and try again. Some providers may block browser requests (CORS).",
    errorLnInvoiceDecode:
      "Could not decode Lightning invoice. Check the invoice and try again.",
    errorLnInvoiceNoAddress: "Look up a Lightning address before generating an invoice.",
    errorLnInvoiceAmount: "Enter a valid whole-satoshi amount.",
    errorLnInvoiceAmountLow: "Amount is below the minimum for this address.",
    errorLnInvoiceAmountHigh: "Amount is above the maximum for this address.",
    errorLnInvoiceComment: "This address does not accept comments.",
    errorLnInvoiceCommentLong: "Comment is too long for this address.",
    errorLnInvoiceInvalid: "The provider returned an invalid invoice.",
    errorLnInvoiceFetch:
      "Could not generate invoice. Check the amount and try again.",
    confidential: "Confidential",
    errorQrLibrary:
      "QR code library failed to load. Refresh the page and try again.",
    errorQrGenerate: "Could not generate QR code. Please try again.",
    errorExportLibrary:
      "Excel export library failed to load. Refresh the page and try again.",
    errorExportNoAddress: "Look up an address or public key before exporting.",
    errorExportFetch:
      "Could not export transactions. Check the connection and try again.",
    errorExportEmpty: "No transactions found for this address.",
    yes: "Yes",
    no: "No",
    unknown: "Unknown",
    na: "N/A",
    btcUnconfirmed: "{amount} BTC unconfirmed",
    zeroSeconds: "0 seconds",
    unitYear: "year",
    unitYears: "years",
    unitMonth: "month",
    unitMonths: "months",
    unitDay: "day",
    unitDays: "days",
    unitHour: "hour",
    unitHours: "hours",
    unitMinute: "minute",
    unitMinutes: "minutes",
    unitSecond: "second",
    unitSeconds: "seconds",
    am: "AM",
    pm: "PM",
  },
  "pt-BR": {
    pageTitle: "Explorador Bitcoin",
    pageHeading: "Explorador Bitcoin",
    pageSub:
      "Explorador de dados em tempo real para Bitcoin on-chain, Lightning ou Liquid",
    searchLabel: "Verifique seu endereço, transação, canal ou fatura abaixo:",
    searchPlaceholder: "ex.: bc1q...",
    txId: "ID da Transação:",
    txDate: "Data da primeira detecção:",
    txStatus: "Status:",
    txConfirmed: "Confirmada",
    txUnconfirmed: "Não confirmada",
    txConfirmedAt: "Data de confirmação:",
    txTimeToConfirmation: "Tempo até confirmação:",
    txTimeSinceConfirmation: "Tempo desde confirmação:",
    txBackToChannel: "Voltar ao canal",
    txFee: "Taxa:",
    txFeeLine: "{rate} sat/vB × {vsize} vB = {fee} sats",
    txEmbeddedData: "Dados embutidos:",
    txConfirmations: "Confirmações:",
    errorTxFetch:
      "Não foi possível buscar a transação. Verifique o txid e tente novamente.",
    check: "Verificar",
    loading: "Carregando...",
    actionMenuLabel: "Mais ações",
    actionMenuExport: "Exportar transações para Excel",
    exportLoading: "Exportando...",
    exportGenerating: "Gerando arquivo...",
    exportPhaseFetchingTxs: "Buscando transações...",
    exportProgressTxs: "Transações: {done} / {total}",
    exportPhaseRetrying: "Problema de conexão, tentando novamente...",
    exportProgressRetry:
      "Tentativa {attempt} de {maxRetries} — {done} transações mantidas",
    exportProgressBuilding: "Linhas: {done} / {total}",
    exportProgressDownloading: "Arquivo pronto: {total} transações",
    exportPhaseBuilding: "Montando planilha...",
    exportPhaseDownloading: "Baixando arquivo...",
    exportSheetTransactions: "Transações",
    exportSheetSummary: "Resumo",
    exportColTxId: "ID da Transação",
    exportColConfirmedTs: "Timestamp Confirmado (UTC)",
    exportColType: "Tipo",
    exportColAmount: "Valor (BTC)",
    exportColSizeBytes: "Tamanho (bytes)",
    exportColSizeVbytes: "Tamanho (vB)",
    exportColFeeRate: "Taxa (sat/vB)",
    exportColFee: "Taxa (BTC)",
    exportColBlockHeight: "Altura do Bloco",
    exportColInputsCount: "Qtd. de Entradas",
    exportColOutputsCount: "Qtd. de Saídas",
    exportTypeReceived: "Recebido",
    exportTypeSent: "Enviado",
    exportSummaryAddress: "Endereço Bitcoin",
    exportSummaryPublicKey: "Chave Pública",
    exportSummaryTotalTxs: "Total de Transações",
    exportSummaryTotalReceived: "Total Recebido (BTC)",
    exportSummaryTotalSent: "Total Enviado (BTC)",
    exportSummaryBalance: "Saldo Atual (BTC)",
    exportSummaryNote:
      "Nota: A data de primeira aparição no mempool não é registrada na blockchain Bitcoin e nem sempre está disponível em serviços de terceiros. Por esse motivo, ela não foi incluída nesta exportação. Este arquivo contém apenas dados publicamente disponíveis na blockchain.",
    qrShow: "Mostrar QR code do endereço",
    qrTitle: "Código QR",
    qrCanvasLabel: "QR code do endereço",
    qrCopyInvoice: "Copiar fatura",
    qrCopied: "Copiado!",
    lnQrShow: "Mostrar QR code do endereço",
    lnInvoiceShow: "Gerar fatura",
    lnInvoiceTitle: "Gerar fatura",
    lnInvoiceAmount: "Valor (sats)",
    lnInvoiceAmountHint: "Mín {min} · Máx {max}",
    lnInvoiceComment: "Comentário (opcional)",
    lnInvoiceGenerate: "Gerar",
    lnInvoiceCancel: "Cancelar",
    lnInvoiceQrLabel: "QR code da fatura Lightning",
    lnAddress: "Endereço Lightning:",
    lnDomain: "Domínio:",
    lnMinAmount: "Valor mínimo:",
    lnMaxAmount: "Valor máximo:",
    lnComment: "Comentários:",
    lnCommentAllowed: "Até {max} caracteres",
    lnNoDescription: "Endereço Lightning",
    lnChannelId: "ID do Canal:",
    lnChannelFullId: "ID Completo:",
    lnCapacity: "Capacidade:",
    lnCreated: "Criado:",
    lnUpdated: "Atualizado:",
    lnNodeLeft: "Nó A:",
    lnNodeRight: "Nó B:",
    lnFundingTx: "TX de Abertura:",
    lnClosingTx: "TX de Fechamento:",
    lnChannelStatusOpen: "Aberto",
    lnChannelStatusClosed: "Fechado",
    lnInvoiceLabel: "Fatura:",
    lnInvoiceAmountLabel: "Valor:",
    lnInvoiceDescription: "Descrição:",
    lnInvoiceDestination: "Nó de destino:",
    lnInvoicePaymentHash: "Payment hash:",
    lnInvoiceCreated: "Criação:",
    lnInvoiceExpires: "Expiração:",
    lnInvoiceAnyAmount: "Qualquer valor",
    lnInvoiceStatusValid: "Válida",
    lnInvoiceStatusExpired: "Expirada",
    lnInvoiceNoDescription: "Sem descrição",
    unitSats: "sats",
    networkLightning: "Lightning",
    address: "Endereço:",
    publicKey: "Chave Pública:",
    network: "Rede:",
    networkBitcoin: "Bitcoin",
    networkLiquid: "Liquid",
    addressType: "Tipo de Endereço:",
    exposedPubKey: "Chave Pública Exposta:",
    transactions: "Transações:",
    lastTxDate: "Data da Última Transação:",
    timeSinceLast: "Tempo Desde a Última Transação:",
    footerCreatedBy: "Criado por",
    navHome: "Início",
    navStats: "Estatísticas",
    navNetwork: "Rede",
    navValuation: "Avaliação",
    blockHeight: "Altura: {height}",
    bitcoinPrice: "Preço: {value}",
    blocksToDifficulty: "Ajuste de Dificuldade: {blocks}",
    blocksToHalving: "Halving: {blocks}",
    totalSupply: "Oferta: {amount} BTC",
    hashrate: "Hash Rate: {value}",
    networkDifficulty: "Dificuldade: {value}",
    mayerMultiple: "Mayer Multiple: {value}",
    mvrvRatio: "MVRV Ratio: {value}",
    fearGreedIndex: "Fear & Greed: {value}",
    fearGreedExtremeFear: "Medo Extremo",
    fearGreedFear: "Medo",
    fearGreedNeutral: "Neutro",
    fearGreedGreed: "Ganância",
    fearGreedExtremeGreed: "Ganância Extrema",
    socialLinks: "Links sociais",
    language: "Idioma",
    muteSounds: "Silenciar sons",
    unmuteSounds: "Ativar sons",
    soundsOn: "Sons ligados",
    soundsOff: "Sons desligados",
    errorEmpty:
      "Por favor, insira um endereço Bitcoin ou Liquid, chave pública, ID de transação, canal Lightning, endereço Lightning ou fatura Lightning.",
    errorInvalidPubkey:
      "Chave pública inválida. Cole uma chave comprimida (02/03...) ou não comprimida (04...) em hexadecimal.",
    errorFetch:
      "Não foi possível buscar o saldo. Verifique o endereço ou a chave pública e tente novamente.",
    errorLnChannelFetch:
      "Não foi possível buscar o canal Lightning. Verifique o ID do canal e tente novamente.",
    errorLnAddressFetch:
      "Não foi possível buscar o endereço Lightning. Verifique o endereço e tente novamente. Alguns provedores podem bloquear pedidos do navegador (CORS).",
    errorLnInvoiceDecode:
      "Não foi possível decodificar a fatura Lightning. Verifique a fatura e tente novamente.",
    errorLnInvoiceNoAddress:
      "Busque um endereço Lightning antes de gerar uma fatura.",
    errorLnInvoiceAmount: "Insira um valor inteiro válido em satoshis.",
    errorLnInvoiceAmountLow: "O valor está abaixo do mínimo deste endereço.",
    errorLnInvoiceAmountHigh: "O valor está acima do máximo deste endereço.",
    errorLnInvoiceComment: "Este endereço não aceita comentários.",
    errorLnInvoiceCommentLong: "O comentário é longo demais para este endereço.",
    errorLnInvoiceInvalid: "O provedor retornou uma fatura inválida.",
    errorLnInvoiceFetch:
      "Não foi possível gerar a fatura. Verifique o valor e tente novamente.",
    confidential: "Confidencial",
    errorQrLibrary:
      "A biblioteca de QR code falhou ao carregar. Atualize a página e tente novamente.",
    errorQrGenerate: "Não foi possível gerar o código QR. Tente novamente.",
    errorExportLibrary:
      "A biblioteca de exportação para Excel falhou ao carregar. Atualize a página e tente novamente.",
    errorExportNoAddress:
      "Busque um endereço ou chave pública antes de exportar.",
    errorExportFetch:
      "Não foi possível exportar as transações. Verifique a conexão e tente novamente.",
    errorExportEmpty: "Nenhuma transação encontrada para este endereço.",
    yes: "Sim",
    no: "Não",
    unknown: "Desconhecido",
    na: "N/D",
    btcUnconfirmed: "{amount} BTC não confirmado",
    zeroSeconds: "0 segundos",
    unitYear: "ano",
    unitYears: "anos",
    unitMonth: "mês",
    unitMonths: "meses",
    unitDay: "dia",
    unitDays: "dias",
    unitHour: "hora",
    unitHours: "horas",
    unitMinute: "minuto",
    unitMinutes: "minutos",
    unitSecond: "segundo",
    unitSeconds: "segundos",
    am: "",
    pm: "",
  },
};

let currentLang = DEFAULT_LANG;
const languageChangeListeners = [];

function t(key, vars = {}) {
  const table = translations[currentLang] ?? translations[DEFAULT_LANG];
  let text = table[key] ?? translations[DEFAULT_LANG][key] ?? key;

  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, value);
  }

  return text;
}

function getLocale() {
  return currentLang === "pt-BR" ? "pt-BR" : "en-US";
}

function getCurrentLang() {
  return currentLang;
}

function getDisplayCurrency() {
  return currentLang === "pt-BR" ? "BRL" : "USD";
}

function loadLanguagePreference() {
  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && translations[stored]) {
      currentLang = stored;
    }
  } catch (err) {
    console.error(err);
  }
}

function saveLanguagePreference(lang) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch (err) {
    console.error(err);
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang === "pt-BR" ? "pt-BR" : "en";
  document.title = t("pageTitle");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const attr = el.getAttribute("data-i18n-attr");

    if (attr) {
      el.setAttribute(attr, t(key));
      return;
    }

    el.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.getAttribute("data-i18n-title"));
  });

  updateLangSelectUi();
}

function updateLangSelectUi() {
  const langToggleBtn = document.getElementById("langToggleBtn");
  if (!langToggleBtn) return;

  langToggleBtn.setAttribute("aria-label", t("language"));
  langToggleBtn.classList.remove("lang-select--en", "lang-select--pt-BR");
  langToggleBtn.classList.add(
    currentLang === "pt-BR" ? "lang-select--pt-BR" : "lang-select--en",
  );

  document.querySelectorAll(".lang-menu__option").forEach((option) => {
    const isSelected = option.dataset.lang === currentLang;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });
}

function closeLangMenu() {
  const langMenu = document.getElementById("langMenu");
  const langToggleBtn = document.getElementById("langToggleBtn");
  if (!langMenu || !langToggleBtn) return;

  langMenu.hidden = true;
  langToggleBtn.setAttribute("aria-expanded", "false");
}

function toggleLangMenu() {
  const langMenu = document.getElementById("langMenu");
  const langToggleBtn = document.getElementById("langToggleBtn");
  if (!langMenu || !langToggleBtn) return;

  const willOpen = langMenu.hidden;
  langMenu.hidden = !willOpen;
  langToggleBtn.setAttribute("aria-expanded", String(willOpen));
}

function setLanguage(lang) {
  if (!translations[lang] || lang === currentLang) return;

  currentLang = lang;
  saveLanguagePreference(lang);
  applyStaticTranslations();

  if (typeof updateSoundToggleUi === "function") {
    updateSoundToggleUi();
  }

  languageChangeListeners.forEach((listener) => listener(lang));
}

function onLanguageChange(listener) {
  languageChangeListeners.push(listener);
}

function initLanguageSelector() {
  loadLanguagePreference();
  applyStaticTranslations();

  const langToggleBtn = document.getElementById("langToggleBtn");
  const langMenu = document.getElementById("langMenu");
  if (!langToggleBtn || !langMenu) return;

  langToggleBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleLangMenu();
  });

  langMenu.querySelectorAll(".lang-menu__option").forEach((option) => {
    option.addEventListener("click", () => {
      setLanguage(option.dataset.lang);
      closeLangMenu();
    });
  });

  document.addEventListener("click", (event) => {
    if (
      !langMenu.hidden &&
      !event.target.closest(".lang-picker")
    ) {
      closeLangMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLangMenu();
    }
  });
}

initLanguageSelector();