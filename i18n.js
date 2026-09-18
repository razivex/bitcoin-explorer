const LANG_STORAGE_KEY = "bitcoin-explorer-language";
const CURRENCY_STORAGE_KEY = "bitcoin-explorer-currency";
const DEFAULT_LANG = "en";
const DEFAULT_CURRENCY = "USD";
const SUPPORTED_CURRENCIES = ["USD", "BRL", "EUR", "JPY"];
const SUPPORTED_LANGS = ["en", "pt-BR", "es", "fr", "ja"];
const LANG_LOCALES = {
  en: "en-US",
  "pt-BR": "pt-BR",
  es: "es-ES",
  fr: "fr-FR",
  ja: "ja-JP",
};

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
    exportColConfirmedTs: "Timestamp Confirmed",
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
    networkBitcoinTestnet: "Bitcoin Testnet",
    networkLiquid: "Liquid",
    addressType: "Address Type:",
    addressTypeSilentPayment: "Silent Payment",
    exposedPubKey: "Exposed PubKey:",
    scanKey: "Scan Key:",
    spendKey: "Spend Key:",
    transactions: "Transactions:",
    lastTxDate: "Last Transaction Date:",
    timeSinceLast: "Time Since Last Transaction:",
    footerCreatedBy: "Created by",
    navHome: "Home",
    navStats: "Stats",
    navNetwork: "Network",
    navValuation: "Valuation",
    networkPageSub: "Live Bitcoin network statistics",
    valuationPageSub: "Live Bitcoin valuation metrics",
    statLabelHeight: "Block Height",
    statLabelDifficultyAdj: "Blocks to Difficult Adjustment",
    statLabelHalving: "Blocks to Halving",
    statLabelSupply: "Total Supply",
    statLabelAddresses: "Non-Zero Addresses",
    statLabelTransactions: "Total Transactions",
    statLabelHashrate: "Hash Rate",
    statLabelFeeRate: "Fee Rate",
    statLabelDifficulty: "Difficulty",
    statLabelMayer: "Mayer Multiple",
    statLabelMvrv: "MVRV Ratio",
    statLabelFearGreed: "Fear & Greed",
    statLabelPrice: "Bitcoin Price",
    blockHeight: "Height: {height}",
    bitcoinPrice: "Price: {value}",
    blocksToDifficulty: "Difficult Adjustment: {blocks}",
    blocksToHalving: "Halving: {blocks}",
    totalSupply: "Supply: {amount} BTC",
    hashrate: "Hash Rate: {value}",
    networkDifficulty: "Difficulty: {value}",
    nonZeroAddresses: "Addresses: {count}",
    mayerMultiple: "Mayer Multiple: {value}",
    mvrvRatio: "MVRV Ratio: {value}",
    fearGreedIndex: "Fear & Greed: {value}",
    fearGreedExtremeFear: "Extreme Fear",
    fearGreedFear: "Fear",
    fearGreedNeutral: "Neutral",
    fearGreedGreed: "Greed",
    fearGreedExtremeGreed: "Extreme Greed",
    socialLinks: "Social links",
    settings: "Settings",
    settingsPageSub: "Language, currency, notifications, and about",
    language: "Language",
    currency: "Currency",
    notifications: "Notifications",
    notificationsOn: "On",
    notificationsOff: "Off",
    notifyToggleOn: "ON",
    notifyToggleOff: "OFF",
    notifyPrefNewBlock: "New block mined",
    notifyPrefNewBlockDesc: "Alert when a new Bitcoin block is mined.",
    notifyPrefDifficulty: "Difficulty adjustment",
    notifyPrefDifficultyDesc:
      "Alert when Bitcoin mining difficulty adjusts (every 2,016 blocks).",
    notifyPrefHalving: "Halving",
    notifyPrefHalvingDesc:
      "Alert when a Bitcoin halving occurs (every 210,000 blocks).",
    notifyPrefTxConfirmed: "Transaction confirmed",
    notifyPrefTxConfirmedDesc:
      "Alert when the open transaction confirms, or when a transaction on the open address confirms.",
    notifyPrefAddressNewTx: "New address transaction",
    notifyPrefAddressNewTxDesc: "Alert when a new transaction appears on the open address.",
    notifyNewBlock: "New block mined",
    notifyDifficulty: "Difficulty adjusted",
    notifyHalving: "Bitcoin halving",
    notifyTxConfirmed: "Transaction confirmed",
    notifyAddressNewTx: "New transaction",
    notifyBodyBlock: "Block height: {height}",
    notifyBodyDifficulty: "Difficulty retarget at block {height}.",
    notifyBodyHalving:
      "Subsidy halved at block {height}. New subsidy: {subsidy} BTC.",
    notifyBodyTx: "Transaction {txid}",
    notifyBodyAddress: "Address {address}",
    notifyTestTitle: "Notifications enabled",
    notifyTestBody:
      "Alerts appear in Windows while this tab stays open. You can minimize it, but do not close it.",
    about: "About",
    aboutClose: "Close",
    aboutLoading: "Loading…",
    aboutLoadError: "Could not load the README. Open the project README.md file, or view it on GitHub.",
    muteSounds: "Mute sounds",
    unmuteSounds: "Unmute sounds",
    soundsOn: "Sounds on",
    soundsOff: "Sounds off",
    errorEmpty:
      "Please enter a Bitcoin or Liquid address, silent payment address, public key, transaction ID, Lightning channel, Lightning address, or Lightning invoice.",
    errorInvalidPubkey:
      "Invalid public key. Paste a compressed (02/03...) or uncompressed (04...) key in hex.",
    errorInvalidSilentPayment:
      "Invalid silent payment address. Check the address and try again.",
    errorIncompleteSilentPayment:
      "This silent payment address looks incomplete. A BIP-352 address is about 116 characters (sp1…). Paste the full address and try again.",
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
    errorExportSilentPayment:
      "Silent payment addresses cannot be scanned by an explorer, so transactions cannot be exported.",
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
    exportColConfirmedTs: "Timestamp Confirmado",
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
    networkBitcoinTestnet: "Bitcoin Testnet",
    networkLiquid: "Liquid",
    addressType: "Tipo de Endereço:",
    addressTypeSilentPayment: "Silent Payment",
    exposedPubKey: "Chave Pública Exposta:",
    scanKey: "Chave de Scan:",
    spendKey: "Chave de Gasto:",
    transactions: "Transações:",
    lastTxDate: "Data da Última Transação:",
    timeSinceLast: "Tempo Desde a Última Transação:",
    footerCreatedBy: "Criado por",
    navHome: "Início",
    navStats: "Estatísticas",
    navNetwork: "Rede",
    navValuation: "Avaliação",
    networkPageSub: "Estatísticas ao vivo da rede Bitcoin",
    valuationPageSub: "Métricas ao vivo de avaliação do Bitcoin",
    statLabelHeight: "Altura do Bloco",
    statLabelDifficultyAdj: "Blocos até o Ajuste de Dificuldade",
    statLabelHalving: "Blocos até o Halving",
    statLabelSupply: "Oferta Total",
    statLabelAddresses: "Endereços com Saldo",
    statLabelTransactions: "Transações Totais",
    statLabelHashrate: "Hash Rate",
    statLabelFeeRate: "Taxa de Fee",
    statLabelDifficulty: "Dificuldade",
    statLabelMayer: "Mayer Multiple",
    statLabelMvrv: "MVRV Ratio",
    statLabelFearGreed: "Fear & Greed",
    statLabelPrice: "Preço do Bitcoin",
    blockHeight: "Altura: {height}",
    bitcoinPrice: "Preço: {value}",
    blocksToDifficulty: "Ajuste de Dificuldade: {blocks}",
    blocksToHalving: "Halving: {blocks}",
    totalSupply: "Oferta: {amount} BTC",
    hashrate: "Hash Rate: {value}",
    networkDifficulty: "Dificuldade: {value}",
    nonZeroAddresses: "Endereços: {count}",
    mayerMultiple: "Mayer Multiple: {value}",
    mvrvRatio: "MVRV Ratio: {value}",
    fearGreedIndex: "Fear & Greed: {value}",
    fearGreedExtremeFear: "Medo Extremo",
    fearGreedFear: "Medo",
    fearGreedNeutral: "Neutro",
    fearGreedGreed: "Ganância",
    fearGreedExtremeGreed: "Ganância Extrema",
    socialLinks: "Links sociais",
    settings: "Configurações",
    settingsPageSub: "Idioma, moeda, notificações e sobre",
    language: "Idioma",
    currency: "Moeda",
    notifications: "Notificações",
    notificationsOn: "Ligadas",
    notificationsOff: "Desligadas",
    notifyToggleOn: "ON",
    notifyToggleOff: "OFF",
    notifyPrefNewBlock: "Novo bloco minerado",
    notifyPrefNewBlockDesc: "Alerta quando um novo bloco Bitcoin é minerado.",
    notifyPrefDifficulty: "Ajuste de dificuldade",
    notifyPrefDifficultyDesc:
      "Alerta quando a dificuldade de mineração do Bitcoin ajusta (a cada 2.016 blocos).",
    notifyPrefHalving: "Halving",
    notifyPrefHalvingDesc:
      "Alerta quando ocorre um halving do Bitcoin (a cada 210.000 blocos).",
    notifyPrefTxConfirmed: "Transação confirmada",
    notifyPrefTxConfirmedDesc:
      "Alerta quando a transação aberta confirma, ou quando uma transação do endereço aberto confirma.",
    notifyPrefAddressNewTx: "Nova transação no endereço",
    notifyPrefAddressNewTxDesc: "Alerta quando uma nova transação aparece no endereço aberto.",
    notifyNewBlock: "Novo bloco minerado",
    notifyDifficulty: "Dificuldade ajustada",
    notifyHalving: "Halving do Bitcoin",
    notifyTxConfirmed: "Transação confirmada",
    notifyAddressNewTx: "Nova transação",
    notifyBodyBlock: "Altura do bloco: {height}",
    notifyBodyDifficulty: "Retarget de dificuldade no bloco {height}.",
    notifyBodyHalving:
      "Subsídio reduzido pela metade no bloco {height}. Novo subsídio: {subsidy} BTC.",
    notifyBodyTx: "Transação {txid}",
    notifyBodyAddress: "Endereço {address}",
    notifyTestTitle: "Notificações ativadas",
    notifyTestBody:
      "Os alertas aparecem no Windows enquanto esta aba permanecer aberta. Você pode minimizar, mas não feche.",
    about: "Sobre",
    aboutClose: "Fechar",
    aboutLoading: "Carregando…",
    aboutLoadError:
      "Não foi possível carregar o README. Abra o arquivo README.md do projeto, ou veja-o no GitHub.",
    muteSounds: "Silenciar sons",
    unmuteSounds: "Ativar sons",
    soundsOn: "Sons ligados",
    soundsOff: "Sons desligados",
    errorEmpty:
      "Por favor, insira um endereço Bitcoin ou Liquid, endereço silent payment, chave pública, ID de transação, canal Lightning, endereço Lightning ou fatura Lightning.",
    errorInvalidPubkey:
      "Chave pública inválida. Cole uma chave comprimida (02/03...) ou não comprimida (04...) em hexadecimal.",
    errorInvalidSilentPayment:
      "Endereço silent payment inválido. Verifique o endereço e tente novamente.",
    errorIncompleteSilentPayment:
      "Este endereço silent payment parece incompleto. Um endereço BIP-352 tem cerca de 116 caracteres (sp1…). Cole o endereço completo e tente novamente.",
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
    errorExportSilentPayment:
      "Exploradores não conseguem varrer endereços silent payment, então as transações não podem ser exportadas.",
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
  es: {
    pageTitle: "Explorador Bitcoin",
    pageHeading: "Explorador Bitcoin",
    pageSub:
      "Explorador de datos en tiempo real para Bitcoin on-chain, Lightning o Liquid",
    searchLabel: "Comprueba tu dirección, transacción, canal o factura abajo:",
    searchPlaceholder: "ej.: bc1q...",
    txId: "ID de transacción:",
    txDate: "Fecha de primera detección:",
    txStatus: "Estado:",
    txConfirmed: "Confirmada",
    txUnconfirmed: "No confirmada",
    txConfirmedAt: "Fecha de confirmación:",
    txTimeToConfirmation: "Tiempo hasta la confirmación:",
    txTimeSinceConfirmation: "Tiempo desde la confirmación:",
    txBackToChannel: "Volver al canal",
    txFee: "Comisión:",
    txFeeLine: "{rate} sat/vB × {vsize} vB = {fee} sats",
    txEmbeddedData: "Datos incrustados:",
    txConfirmations: "Confirmaciones:",
    errorTxFetch:
      "No se pudo obtener la transacción. Comprueba el txid e inténtalo de nuevo.",
    check: "Comprobar",
    loading: "Cargando...",
    actionMenuLabel: "Más acciones",
    actionMenuExport: "Exportar transacciones a Excel",
    exportLoading: "Exportando...",
    exportGenerating: "Generando archivo...",
    exportPhaseFetchingTxs: "Obteniendo transacciones...",
    exportProgressTxs: "Transacciones: {done} / {total}",
    exportPhaseRetrying: "Problema de conexión, reintentando...",
    exportProgressRetry:
      "Intento {attempt} de {maxRetries} — {done} transacciones conservadas",
    exportProgressBuilding: "Filas: {done} / {total}",
    exportProgressDownloading: "Archivo listo: {total} transacciones",
    exportPhaseBuilding: "Creando hoja de cálculo...",
    exportPhaseDownloading: "Descargando archivo...",
    exportSheetTransactions: "Transacciones",
    exportSheetSummary: "Resumen",
    exportColTxId: "ID de transacción",
    exportColConfirmedTs: "Marca de tiempo confirmada",
    exportColType: "Tipo",
    exportColAmount: "Importe (BTC)",
    exportColSizeBytes: "Tamaño (bytes)",
    exportColSizeVbytes: "Tamaño (vB)",
    exportColFeeRate: "Comisión (sat/vB)",
    exportColFee: "Comisión (BTC)",
    exportColBlockHeight: "Altura de bloque",
    exportColInputsCount: "N.º de entradas",
    exportColOutputsCount: "N.º de salidas",
    exportTypeReceived: "Recibido",
    exportTypeSent: "Enviado",
    exportSummaryAddress: "Dirección Bitcoin",
    exportSummaryPublicKey: "Clave pública",
    exportSummaryTotalTxs: "Total de transacciones",
    exportSummaryTotalReceived: "Total recibido (BTC)",
    exportSummaryTotalSent: "Total enviado (BTC)",
    exportSummaryBalance: "Saldo actual (BTC)",
    exportSummaryNote:
      "Nota: La hora de primera aparición en el mempool no se registra en la blockchain de Bitcoin y no siempre está disponible en servicios de terceros. Por eso no se incluye en esta exportación. Este archivo solo contiene datos públicos de la blockchain.",
    qrShow: "Mostrar código QR de la dirección",
    qrTitle: "Código QR",
    qrCanvasLabel: "Código QR de la dirección",
    qrCopyInvoice: "Copiar factura",
    qrCopied: "¡Copiado!",
    lnQrShow: "Mostrar código QR de la dirección",
    lnInvoiceShow: "Generar factura",
    lnInvoiceTitle: "Generar factura",
    lnInvoiceAmount: "Importe (sats)",
    lnInvoiceAmountHint: "Mín {min} · Máx {max}",
    lnInvoiceComment: "Comentario (opcional)",
    lnInvoiceGenerate: "Generar",
    lnInvoiceCancel: "Cancelar",
    lnInvoiceQrLabel: "Código QR de la factura Lightning",
    lnAddress: "Dirección Lightning:",
    lnDomain: "Dominio:",
    lnMinAmount: "Importe mínimo:",
    lnMaxAmount: "Importe máximo:",
    lnComment: "Comentarios:",
    lnCommentAllowed: "Hasta {max} caracteres",
    lnNoDescription: "Dirección Lightning",
    lnChannelId: "ID del canal:",
    lnChannelFullId: "ID completo:",
    lnCapacity: "Capacidad:",
    lnCreated: "Creado:",
    lnUpdated: "Actualizado:",
    lnNodeLeft: "Nodo A:",
    lnNodeRight: "Nodo B:",
    lnFundingTx: "TX de apertura:",
    lnClosingTx: "TX de cierre:",
    lnChannelStatusOpen: "Abierto",
    lnChannelStatusClosed: "Cerrado",
    lnInvoiceLabel: "Factura:",
    lnInvoiceAmountLabel: "Importe:",
    lnInvoiceDescription: "Descripción:",
    lnInvoiceDestination: "Nodo de destino:",
    lnInvoicePaymentHash: "Payment hash:",
    lnInvoiceCreated: "Creación:",
    lnInvoiceExpires: "Caducidad:",
    lnInvoiceAnyAmount: "Cualquier importe",
    lnInvoiceStatusValid: "Válida",
    lnInvoiceStatusExpired: "Caducada",
    lnInvoiceNoDescription: "Sin descripción",
    unitSats: "sats",
    networkLightning: "Lightning",
    address: "Dirección:",
    publicKey: "Clave pública:",
    network: "Red:",
    networkBitcoin: "Bitcoin",
    networkBitcoinTestnet: "Bitcoin Testnet",
    networkLiquid: "Liquid",
    addressType: "Tipo de dirección:",
    addressTypeSilentPayment: "Silent Payment",
    exposedPubKey: "Clave pública expuesta:",
    scanKey: "Clave de escaneo:",
    spendKey: "Clave de gasto:",
    transactions: "Transacciones:",
    lastTxDate: "Fecha de la última transacción:",
    timeSinceLast: "Tiempo desde la última transacción:",
    footerCreatedBy: "Creado por",
    navHome: "Inicio",
    navStats: "Estadísticas",
    navNetwork: "Red",
    navValuation: "Valoración",
    networkPageSub: "Estadísticas en vivo de la red Bitcoin",
    valuationPageSub: "Métricas en vivo de valoración de Bitcoin",
    statLabelHeight: "Altura de bloque",
    statLabelDifficultyAdj: "Bloques hasta el ajuste de dificultad",
    statLabelHalving: "Bloques hasta el halving",
    statLabelSupply: "Oferta total",
    statLabelAddresses: "Direcciones con saldo",
    statLabelTransactions: "Transacciones totales",
    statLabelHashrate: "Hash rate",
    statLabelFeeRate: "Comisión",
    statLabelDifficulty: "Dificultad",
    statLabelMayer: "Mayer Multiple",
    statLabelMvrv: "MVRV Ratio",
    statLabelFearGreed: "Fear & Greed",
    statLabelPrice: "Precio de Bitcoin",
    blockHeight: "Altura: {height}",
    bitcoinPrice: "Precio: {value}",
    blocksToDifficulty: "Ajuste de dificultad: {blocks}",
    blocksToHalving: "Halving: {blocks}",
    totalSupply: "Oferta: {amount} BTC",
    hashrate: "Hash rate: {value}",
    networkDifficulty: "Dificultad: {value}",
    nonZeroAddresses: "Direcciones: {count}",
    mayerMultiple: "Mayer Multiple: {value}",
    mvrvRatio: "MVRV Ratio: {value}",
    fearGreedIndex: "Fear & Greed: {value}",
    fearGreedExtremeFear: "Miedo extremo",
    fearGreedFear: "Miedo",
    fearGreedNeutral: "Neutral",
    fearGreedGreed: "Codicia",
    fearGreedExtremeGreed: "Codicia extrema",
    socialLinks: "Enlaces sociales",
    settings: "Ajustes",
    settingsPageSub: "Idioma, moneda, notificaciones y acerca de",
    language: "Idioma",
    currency: "Moneda",
    notifications: "Notificaciones",
    notificationsOn: "Activadas",
    notificationsOff: "Desactivadas",
    notifyToggleOn: "ON",
    notifyToggleOff: "OFF",
    notifyPrefNewBlock: "Nuevo bloque minado",
    notifyPrefNewBlockDesc: "Aviso cuando se mina un nuevo bloque de Bitcoin.",
    notifyPrefDifficulty: "Ajuste de dificultad",
    notifyPrefDifficultyDesc:
      "Aviso cuando se ajusta la dificultad de minería de Bitcoin (cada 2.016 bloques).",
    notifyPrefHalving: "Halving",
    notifyPrefHalvingDesc:
      "Aviso cuando ocurre un halving de Bitcoin (cada 210.000 bloques).",
    notifyPrefTxConfirmed: "Transacción confirmada",
    notifyPrefTxConfirmedDesc:
      "Aviso cuando la transacción abierta se confirma, o cuando se confirma una transacción de la dirección abierta.",
    notifyPrefAddressNewTx: "Nueva transacción en la dirección",
    notifyPrefAddressNewTxDesc: "Aviso cuando aparece una nueva transacción en la dirección abierta.",
    notifyNewBlock: "Nuevo bloque minado",
    notifyDifficulty: "Dificultad ajustada",
    notifyHalving: "Halving de Bitcoin",
    notifyTxConfirmed: "Transacción confirmada",
    notifyAddressNewTx: "Nueva transacción",
    notifyBodyBlock: "Altura del bloque: {height}",
    notifyBodyDifficulty: "Retarget de dificultad en el bloque {height}.",
    notifyBodyHalving:
      "La recompensa se redujo a la mitad en el bloque {height}. Nueva recompensa: {subsidy} BTC.",
    notifyBodyTx: "Transacción {txid}",
    notifyBodyAddress: "Dirección {address}",
    notifyTestTitle: "Notificaciones activadas",
    notifyTestBody:
      "Las alertas aparecen en Windows mientras esta pestaña siga abierta. Puedes minimizarla, pero no la cierres.",
    about: "Acerca de",
    aboutClose: "Cerrar",
    aboutLoading: "Cargando…",
    aboutLoadError:
      "No se pudo cargar el README. Abre el archivo README.md del proyecto o consúltalo en GitHub.",
    muteSounds: "Silenciar sonidos",
    unmuteSounds: "Activar sonidos",
    soundsOn: "Sonidos activados",
    soundsOff: "Sonidos desactivados",
    errorEmpty:
      "Introduce una dirección Bitcoin o Liquid, una dirección silent payment, una clave pública, un ID de transacción, un canal Lightning, una dirección Lightning o una factura Lightning.",
    errorInvalidPubkey:
      "Clave pública no válida. Pega una clave comprimida (02/03...) o no comprimida (04...) en hexadecimal.",
    errorInvalidSilentPayment:
      "Dirección silent payment no válida. Comprueba la dirección e inténtalo de nuevo.",
    errorIncompleteSilentPayment:
      "Esta dirección silent payment parece incompleta. Una dirección BIP-352 tiene unos 116 caracteres (sp1…). Pega la dirección completa e inténtalo de nuevo.",
    errorFetch:
      "No se pudo obtener el saldo. Comprueba la dirección o la clave pública e inténtalo de nuevo.",
    errorLnChannelFetch:
      "No se pudo obtener el canal Lightning. Comprueba el ID del canal e inténtalo de nuevo.",
    errorLnAddressFetch:
      "No se pudo obtener la dirección Lightning. Comprueba la dirección e inténtalo de nuevo. Algunos proveedores pueden bloquear peticiones del navegador (CORS).",
    errorLnInvoiceDecode:
      "No se pudo decodificar la factura Lightning. Comprueba la factura e inténtalo de nuevo.",
    errorLnInvoiceNoAddress:
      "Busca una dirección Lightning antes de generar una factura.",
    errorLnInvoiceAmount: "Introduce un importe entero válido en satoshis.",
    errorLnInvoiceAmountLow: "El importe está por debajo del mínimo de esta dirección.",
    errorLnInvoiceAmountHigh: "El importe está por encima del máximo de esta dirección.",
    errorLnInvoiceComment: "Esta dirección no acepta comentarios.",
    errorLnInvoiceCommentLong: "El comentario es demasiado largo para esta dirección.",
    errorLnInvoiceInvalid: "El proveedor devolvió una factura no válida.",
    errorLnInvoiceFetch:
      "No se pudo generar la factura. Comprueba el importe e inténtalo de nuevo.",
    confidential: "Confidencial",
    errorQrLibrary:
      "La biblioteca de códigos QR no se cargó. Actualiza la página e inténtalo de nuevo.",
    errorQrGenerate: "No se pudo generar el código QR. Inténtalo de nuevo.",
    errorExportLibrary:
      "La biblioteca de exportación a Excel no se cargó. Actualiza la página e inténtalo de nuevo.",
    errorExportNoAddress:
      "Busca una dirección o clave pública antes de exportar.",
    errorExportSilentPayment:
      "Los exploradores no pueden escanear direcciones silent payment, así que las transacciones no se pueden exportar.",
    errorExportFetch:
      "No se pudieron exportar las transacciones. Comprueba la conexión e inténtalo de nuevo.",
    errorExportEmpty: "No se encontraron transacciones para esta dirección.",
    yes: "Sí",
    no: "No",
    unknown: "Desconocido",
    na: "N/D",
    btcUnconfirmed: "{amount} BTC no confirmado",
    zeroSeconds: "0 segundos",
    unitYear: "año",
    unitYears: "años",
    unitMonth: "mes",
    unitMonths: "meses",
    unitDay: "día",
    unitDays: "días",
    unitHour: "hora",
    unitHours: "horas",
    unitMinute: "minuto",
    unitMinutes: "minutos",
    unitSecond: "segundo",
    unitSeconds: "segundos",
    am: "",
    pm: "",
  },
  fr: {
    pageTitle: "Explorateur Bitcoin",
    pageHeading: "Explorateur Bitcoin",
    pageSub:
      "Explorateur de données en temps réel pour Bitcoin on-chain, Lightning ou Liquid",
    searchLabel: "Vérifiez votre adresse, transaction, canal ou facture ci-dessous :",
    searchPlaceholder: "ex. : bc1q...",
    txId: "ID de transaction :",
    txDate: "Date de première détection :",
    txStatus: "Statut :",
    txConfirmed: "Confirmée",
    txUnconfirmed: "Non confirmée",
    txConfirmedAt: "Date de confirmation :",
    txTimeToConfirmation: "Temps jusqu'à la confirmation :",
    txTimeSinceConfirmation: "Temps depuis la confirmation :",
    txBackToChannel: "Retour au canal",
    txFee: "Frais :",
    txFeeLine: "{rate} sat/vB × {vsize} vB = {fee} sats",
    txEmbeddedData: "Données intégrées :",
    txConfirmations: "Confirmations :",
    errorTxFetch:
      "Impossible de récupérer la transaction. Vérifiez le txid et réessayez.",
    check: "Vérifier",
    loading: "Chargement...",
    actionMenuLabel: "Plus d'actions",
    actionMenuExport: "Exporter les transactions vers Excel",
    exportLoading: "Exportation...",
    exportGenerating: "Génération du fichier...",
    exportPhaseFetchingTxs: "Récupération des transactions...",
    exportProgressTxs: "Transactions : {done} / {total}",
    exportPhaseRetrying: "Problème de connexion, nouvel essai...",
    exportProgressRetry:
      "Tentative {attempt} sur {maxRetries} — {done} transactions conservées",
    exportProgressBuilding: "Lignes : {done} / {total}",
    exportProgressDownloading: "Fichier prêt : {total} transactions",
    exportPhaseBuilding: "Création de la feuille de calcul...",
    exportPhaseDownloading: "Téléchargement du fichier...",
    exportSheetTransactions: "Transactions",
    exportSheetSummary: "Résumé",
    exportColTxId: "ID de transaction",
    exportColConfirmedTs: "Horodatage confirmé",
    exportColType: "Type",
    exportColAmount: "Montant (BTC)",
    exportColSizeBytes: "Taille (octets)",
    exportColSizeVbytes: "Taille (vB)",
    exportColFeeRate: "Frais (sat/vB)",
    exportColFee: "Frais (BTC)",
    exportColBlockHeight: "Hauteur de bloc",
    exportColInputsCount: "Nb d'entrées",
    exportColOutputsCount: "Nb de sorties",
    exportTypeReceived: "Reçu",
    exportTypeSent: "Envoyé",
    exportSummaryAddress: "Adresse Bitcoin",
    exportSummaryPublicKey: "Clé publique",
    exportSummaryTotalTxs: "Total des transactions",
    exportSummaryTotalReceived: "Total reçu (BTC)",
    exportSummaryTotalSent: "Total envoyé (BTC)",
    exportSummaryBalance: "Solde actuel (BTC)",
    exportSummaryNote:
      "Note : L'heure de première apparition dans le mempool n'est pas enregistrée sur la blockchain Bitcoin et n'est pas toujours disponible auprès de services tiers. Elle n'est donc pas incluse dans cet export. Ce fichier ne contient que des données publiques de la blockchain.",
    qrShow: "Afficher le QR code de l'adresse",
    qrTitle: "QR code",
    qrCanvasLabel: "QR code de l'adresse",
    qrCopyInvoice: "Copier la facture",
    qrCopied: "Copié !",
    lnQrShow: "Afficher le QR code de l'adresse",
    lnInvoiceShow: "Générer une facture",
    lnInvoiceTitle: "Générer une facture",
    lnInvoiceAmount: "Montant (sats)",
    lnInvoiceAmountHint: "Min {min} · Max {max}",
    lnInvoiceComment: "Commentaire (facultatif)",
    lnInvoiceGenerate: "Générer",
    lnInvoiceCancel: "Annuler",
    lnInvoiceQrLabel: "QR code de la facture Lightning",
    lnAddress: "Adresse Lightning :",
    lnDomain: "Domaine :",
    lnMinAmount: "Montant min. :",
    lnMaxAmount: "Montant max. :",
    lnComment: "Commentaires :",
    lnCommentAllowed: "Jusqu'à {max} caractères",
    lnNoDescription: "Adresse Lightning",
    lnChannelId: "ID du canal :",
    lnChannelFullId: "ID complet :",
    lnCapacity: "Capacité :",
    lnCreated: "Créé :",
    lnUpdated: "Mis à jour :",
    lnNodeLeft: "Nœud A :",
    lnNodeRight: "Nœud B :",
    lnFundingTx: "TX d'ouverture :",
    lnClosingTx: "TX de fermeture :",
    lnChannelStatusOpen: "Ouvert",
    lnChannelStatusClosed: "Fermé",
    lnInvoiceLabel: "Facture :",
    lnInvoiceAmountLabel: "Montant :",
    lnInvoiceDescription: "Description :",
    lnInvoiceDestination: "Nœud de destination :",
    lnInvoicePaymentHash: "Payment hash :",
    lnInvoiceCreated: "Création :",
    lnInvoiceExpires: "Expiration :",
    lnInvoiceAnyAmount: "N'importe quel montant",
    lnInvoiceStatusValid: "Valide",
    lnInvoiceStatusExpired: "Expirée",
    lnInvoiceNoDescription: "Aucune description",
    unitSats: "sats",
    networkLightning: "Lightning",
    address: "Adresse :",
    publicKey: "Clé publique :",
    network: "Réseau :",
    networkBitcoin: "Bitcoin",
    networkBitcoinTestnet: "Bitcoin Testnet",
    networkLiquid: "Liquid",
    addressType: "Type d'adresse :",
    addressTypeSilentPayment: "Silent Payment",
    exposedPubKey: "Clé publique exposée :",
    scanKey: "Clé de scan :",
    spendKey: "Clé de dépense :",
    transactions: "Transactions :",
    lastTxDate: "Date de la dernière transaction :",
    timeSinceLast: "Temps depuis la dernière transaction :",
    footerCreatedBy: "Créé par",
    navHome: "Accueil",
    navStats: "Statistiques",
    navNetwork: "Réseau",
    navValuation: "Valorisation",
    networkPageSub: "Statistiques en direct du réseau Bitcoin",
    valuationPageSub: "Métriques en direct de valorisation du Bitcoin",
    statLabelHeight: "Hauteur de bloc",
    statLabelDifficultyAdj: "Blocs jusqu'à l'ajustement de difficulté",
    statLabelHalving: "Blocs jusqu'au halving",
    statLabelSupply: "Offre totale",
    statLabelAddresses: "Adresses avec solde",
    statLabelTransactions: "Transactions totales",
    statLabelHashrate: "Hash rate",
    statLabelFeeRate: "Frais",
    statLabelDifficulty: "Difficulté",
    statLabelMayer: "Mayer Multiple",
    statLabelMvrv: "MVRV Ratio",
    statLabelFearGreed: "Fear & Greed",
    statLabelPrice: "Prix du Bitcoin",
    blockHeight: "Hauteur : {height}",
    bitcoinPrice: "Prix : {value}",
    blocksToDifficulty: "Ajustement de difficulté : {blocks}",
    blocksToHalving: "Halving : {blocks}",
    totalSupply: "Offre : {amount} BTC",
    hashrate: "Hash rate : {value}",
    networkDifficulty: "Difficulté : {value}",
    nonZeroAddresses: "Adresses : {count}",
    mayerMultiple: "Mayer Multiple : {value}",
    mvrvRatio: "MVRV Ratio : {value}",
    fearGreedIndex: "Fear & Greed : {value}",
    fearGreedExtremeFear: "Peur extrême",
    fearGreedFear: "Peur",
    fearGreedNeutral: "Neutre",
    fearGreedGreed: "Avidité",
    fearGreedExtremeGreed: "Avidité extrême",
    socialLinks: "Liens sociaux",
    settings: "Paramètres",
    settingsPageSub: "Langue, devise, notifications et à propos",
    language: "Langue",
    currency: "Devise",
    notifications: "Notifications",
    notificationsOn: "Activées",
    notificationsOff: "Désactivées",
    notifyToggleOn: "ON",
    notifyToggleOff: "OFF",
    notifyPrefNewBlock: "Nouveau bloc miné",
    notifyPrefNewBlockDesc: "Alerte lorsqu'un nouveau bloc Bitcoin est miné.",
    notifyPrefDifficulty: "Ajustement de difficulté",
    notifyPrefDifficultyDesc:
      "Alerte lorsque la difficulté de minage de Bitcoin s'ajuste (tous les 2 016 blocs).",
    notifyPrefHalving: "Halving",
    notifyPrefHalvingDesc:
      "Alerte lorsqu'un halving de Bitcoin a lieu (tous les 210 000 blocs).",
    notifyPrefTxConfirmed: "Transaction confirmée",
    notifyPrefTxConfirmedDesc:
      "Alerte lorsque la transaction ouverte se confirme, ou lorsqu'une transaction de l'adresse ouverte se confirme.",
    notifyPrefAddressNewTx: "Nouvelle transaction sur l'adresse",
    notifyPrefAddressNewTxDesc: "Alerte lorsqu'une nouvelle transaction apparaît sur l'adresse ouverte.",
    notifyNewBlock: "Nouveau bloc miné",
    notifyDifficulty: "Difficulté ajustée",
    notifyHalving: "Halving de Bitcoin",
    notifyTxConfirmed: "Transaction confirmée",
    notifyAddressNewTx: "Nouvelle transaction",
    notifyBodyBlock: "Hauteur du bloc : {height}",
    notifyBodyDifficulty: "Retarget de difficulté au bloc {height}.",
    notifyBodyHalving:
      "La subvention a été divisée par deux au bloc {height}. Nouvelle subvention : {subsidy} BTC.",
    notifyBodyTx: "Transaction {txid}",
    notifyBodyAddress: "Adresse {address}",
    notifyTestTitle: "Notifications activées",
    notifyTestBody:
      "Les alertes apparaissent dans Windows tant que cet onglet reste ouvert. Vous pouvez le réduire, mais ne le fermez pas.",
    about: "À propos",
    aboutClose: "Fermer",
    aboutLoading: "Chargement…",
    aboutLoadError:
      "Impossible de charger le README. Ouvrez le fichier README.md du projet, ou consultez-le sur GitHub.",
    muteSounds: "Couper les sons",
    unmuteSounds: "Activer les sons",
    soundsOn: "Sons activés",
    soundsOff: "Sons coupés",
    errorEmpty:
      "Veuillez saisir une adresse Bitcoin ou Liquid, une adresse silent payment, une clé publique, un ID de transaction, un canal Lightning, une adresse Lightning ou une facture Lightning.",
    errorInvalidPubkey:
      "Clé publique invalide. Collez une clé compressée (02/03...) ou non compressée (04...) en hexadécimal.",
    errorInvalidSilentPayment:
      "Adresse silent payment invalide. Vérifiez l'adresse et réessayez.",
    errorIncompleteSilentPayment:
      "Cette adresse silent payment semble incomplète. Une adresse BIP-352 fait environ 116 caractères (sp1…). Collez l'adresse complète et réessayez.",
    errorFetch:
      "Impossible de récupérer le solde. Vérifiez l'adresse ou la clé publique et réessayez.",
    errorLnChannelFetch:
      "Impossible de récupérer le canal Lightning. Vérifiez l'ID du canal et réessayez.",
    errorLnAddressFetch:
      "Impossible de récupérer l'adresse Lightning. Vérifiez l'adresse et réessayez. Certains fournisseurs peuvent bloquer les requêtes du navigateur (CORS).",
    errorLnInvoiceDecode:
      "Impossible de décoder la facture Lightning. Vérifiez la facture et réessayez.",
    errorLnInvoiceNoAddress:
      "Recherchez une adresse Lightning avant de générer une facture.",
    errorLnInvoiceAmount: "Saisissez un montant entier valide en satoshis.",
    errorLnInvoiceAmountLow: "Le montant est inférieur au minimum de cette adresse.",
    errorLnInvoiceAmountHigh: "Le montant est supérieur au maximum de cette adresse.",
    errorLnInvoiceComment: "Cette adresse n'accepte pas les commentaires.",
    errorLnInvoiceCommentLong: "Le commentaire est trop long pour cette adresse.",
    errorLnInvoiceInvalid: "Le fournisseur a renvoyé une facture invalide.",
    errorLnInvoiceFetch:
      "Impossible de générer la facture. Vérifiez le montant et réessayez.",
    confidential: "Confidentiel",
    errorQrLibrary:
      "La bibliothèque de QR code n'a pas pu se charger. Actualisez la page et réessayez.",
    errorQrGenerate: "Impossible de générer le QR code. Réessayez.",
    errorExportLibrary:
      "La bibliothèque d'export Excel n'a pas pu se charger. Actualisez la page et réessayez.",
    errorExportNoAddress:
      "Recherchez une adresse ou une clé publique avant d'exporter.",
    errorExportSilentPayment:
      "Les explorateurs ne peuvent pas scanner les adresses silent payment, les transactions ne peuvent donc pas être exportées.",
    errorExportFetch:
      "Impossible d'exporter les transactions. Vérifiez la connexion et réessayez.",
    errorExportEmpty: "Aucune transaction trouvée pour cette adresse.",
    yes: "Oui",
    no: "Non",
    unknown: "Inconnu",
    na: "N/D",
    btcUnconfirmed: "{amount} BTC non confirmé",
    zeroSeconds: "0 seconde",
    unitYear: "an",
    unitYears: "ans",
    unitMonth: "mois",
    unitMonths: "mois",
    unitDay: "jour",
    unitDays: "jours",
    unitHour: "heure",
    unitHours: "heures",
    unitMinute: "minute",
    unitMinutes: "minutes",
    unitSecond: "seconde",
    unitSeconds: "secondes",
    am: "",
    pm: "",
  },
  ja: {
    pageTitle: "Bitcoinエクスプローラー",
    pageHeading: "Bitcoinエクスプローラー",
    pageSub:
      "オンチェーンBitcoin、Lightning、Liquidのリアルタイムデータエクスプローラー",
    searchLabel: "アドレス、トランザクション、チャネル、またはインボイスを入力してください:",
    searchPlaceholder: "例: bc1q...",
    txId: "トランザクションID:",
    txDate: "初回検出日時:",
    txStatus: "ステータス:",
    txConfirmed: "確認済み",
    txUnconfirmed: "未確認",
    txConfirmedAt: "確認日時:",
    txTimeToConfirmation: "確認までの時間:",
    txTimeSinceConfirmation: "確認からの経過時間:",
    txBackToChannel: "チャネルに戻る",
    txFee: "手数料:",
    txFeeLine: "{rate} sat/vB × {vsize} vB = {fee} sats",
    txEmbeddedData: "埋め込みデータ:",
    txConfirmations: "確認数:",
    errorTxFetch:
      "トランザクションを取得できませんでした。txidを確認して再試行してください。",
    check: "確認",
    loading: "読み込み中...",
    actionMenuLabel: "その他の操作",
    actionMenuExport: "トランザクションをExcelに書き出す",
    exportLoading: "書き出し中...",
    exportGenerating: "ファイルを生成しています...",
    exportPhaseFetchingTxs: "トランザクションを取得しています...",
    exportProgressTxs: "トランザクション: {done} / {total}",
    exportPhaseRetrying: "接続の問題、再試行しています...",
    exportProgressRetry:
      "{maxRetries}回中{attempt}回目 — {done}件のトランザクションを保持",
    exportProgressBuilding: "行: {done} / {total}",
    exportProgressDownloading: "ファイル準備完了: {total}件のトランザクション",
    exportPhaseBuilding: "スプレッドシートを作成しています...",
    exportPhaseDownloading: "ファイルをダウンロードしています...",
    exportSheetTransactions: "トランザクション",
    exportSheetSummary: "概要",
    exportColTxId: "トランザクションID",
    exportColConfirmedTs: "確認タイムスタンプ",
    exportColType: "種類",
    exportColAmount: "金額 (BTC)",
    exportColSizeBytes: "サイズ (bytes)",
    exportColSizeVbytes: "サイズ (vB)",
    exportColFeeRate: "手数料 (sat/vB)",
    exportColFee: "手数料 (BTC)",
    exportColBlockHeight: "ブロック高",
    exportColInputsCount: "入力数",
    exportColOutputsCount: "出力数",
    exportTypeReceived: "受取",
    exportTypeSent: "送金",
    exportSummaryAddress: "Bitcoinアドレス",
    exportSummaryPublicKey: "公開鍵",
    exportSummaryTotalTxs: "トランザクション合計",
    exportSummaryTotalReceived: "受取合計 (BTC)",
    exportSummaryTotalSent: "送金合計 (BTC)",
    exportSummaryBalance: "現在の残高 (BTC)",
    exportSummaryNote:
      "注: メモリプールでの初回検出時刻はBitcoinブロックチェーンに記録されず、第三者サービスでも常に取得できるとは限りません。そのため、この書き出しには含まれていません。このファイルにはブロックチェーン上の公開データのみが含まれます。",
    qrShow: "アドレスのQRコードを表示",
    qrTitle: "QRコード",
    qrCanvasLabel: "アドレスのQRコード",
    qrCopyInvoice: "インボイスをコピー",
    qrCopied: "コピーしました",
    lnQrShow: "アドレスのQRコードを表示",
    lnInvoiceShow: "インボイスを作成",
    lnInvoiceTitle: "インボイスを作成",
    lnInvoiceAmount: "金額 (sats)",
    lnInvoiceAmountHint: "最小 {min} · 最大 {max}",
    lnInvoiceComment: "コメント（任意）",
    lnInvoiceGenerate: "作成",
    lnInvoiceCancel: "キャンセル",
    lnInvoiceQrLabel: "LightningインボイスのQRコード",
    lnAddress: "Lightningアドレス:",
    lnDomain: "ドメイン:",
    lnMinAmount: "最小金額:",
    lnMaxAmount: "最大金額:",
    lnComment: "コメント:",
    lnCommentAllowed: "最大 {max} 文字",
    lnNoDescription: "Lightningアドレス",
    lnChannelId: "チャネルID:",
    lnChannelFullId: "完全ID:",
    lnCapacity: "容量:",
    lnCreated: "作成:",
    lnUpdated: "更新:",
    lnNodeLeft: "ノード A:",
    lnNodeRight: "ノード B:",
    lnFundingTx: "開設TX:",
    lnClosingTx: "閉鎖TX:",
    lnChannelStatusOpen: "開設中",
    lnChannelStatusClosed: "閉鎖済み",
    lnInvoiceLabel: "インボイス:",
    lnInvoiceAmountLabel: "金額:",
    lnInvoiceDescription: "説明:",
    lnInvoiceDestination: "宛先ノード:",
    lnInvoicePaymentHash: "Payment hash:",
    lnInvoiceCreated: "作成時刻:",
    lnInvoiceExpires: "有効期限:",
    lnInvoiceAnyAmount: "任意の金額",
    lnInvoiceStatusValid: "有効",
    lnInvoiceStatusExpired: "期限切れ",
    lnInvoiceNoDescription: "説明なし",
    unitSats: "sats",
    networkLightning: "Lightning",
    address: "アドレス:",
    publicKey: "公開鍵:",
    network: "ネットワーク:",
    networkBitcoin: "Bitcoin",
    networkBitcoinTestnet: "Bitcoin Testnet",
    networkLiquid: "Liquid",
    addressType: "アドレス種類:",
    addressTypeSilentPayment: "Silent Payment",
    exposedPubKey: "公開されている公開鍵:",
    scanKey: "スキャン鍵:",
    spendKey: "支払い鍵:",
    transactions: "トランザクション:",
    lastTxDate: "最終トランザクション日時:",
    timeSinceLast: "最終トランザクションからの経過:",
    footerCreatedBy: "作成者",
    navHome: "ホーム",
    navStats: "統計",
    navNetwork: "ネットワーク",
    navValuation: "バリュエーション",
    networkPageSub: "Bitcoinネットワークのライブ統計",
    valuationPageSub: "Bitcoinバリュエーションのライブ指標",
    statLabelHeight: "ブロック高",
    statLabelDifficultyAdj: "難易度調整までのブロック",
    statLabelHalving: "半減期までのブロック",
    statLabelSupply: "総供給量",
    statLabelAddresses: "残高のあるアドレス",
    statLabelTransactions: "総トランザクション数",
    statLabelHashrate: "ハッシュレート",
    statLabelFeeRate: "手数料レート",
    statLabelDifficulty: "難易度",
    statLabelMayer: "Mayer Multiple",
    statLabelMvrv: "MVRV Ratio",
    statLabelFearGreed: "Fear & Greed",
    statLabelPrice: "Bitcoin価格",
    blockHeight: "高さ: {height}",
    bitcoinPrice: "価格: {value}",
    blocksToDifficulty: "難易度調整: {blocks}",
    blocksToHalving: "半減期: {blocks}",
    totalSupply: "供給: {amount} BTC",
    hashrate: "ハッシュレート: {value}",
    networkDifficulty: "難易度: {value}",
    nonZeroAddresses: "アドレス: {count}",
    mayerMultiple: "Mayer Multiple: {value}",
    mvrvRatio: "MVRV Ratio: {value}",
    fearGreedIndex: "Fear & Greed: {value}",
    fearGreedExtremeFear: "極度の恐怖",
    fearGreedFear: "恐怖",
    fearGreedNeutral: "中立",
    fearGreedGreed: "貪欲",
    fearGreedExtremeGreed: "極度の貪欲",
    socialLinks: "ソーシャルリンク",
    settings: "設定",
    settingsPageSub: "言語、通貨、通知、このアプリについて",
    language: "言語",
    currency: "通貨",
    notifications: "通知",
    notificationsOn: "オン",
    notificationsOff: "オフ",
    notifyToggleOn: "ON",
    notifyToggleOff: "OFF",
    notifyPrefNewBlock: "新しいブロックが採掘された",
    notifyPrefNewBlockDesc: "新しいBitcoinブロックが採掘されたときに通知します。",
    notifyPrefDifficulty: "難易度調整",
    notifyPrefDifficultyDesc:
      "Bitcoinの採掘難易度が調整されたときに通知します（2,016ブロックごと）。",
    notifyPrefHalving: "半減期",
    notifyPrefHalvingDesc:
      "Bitcoinの半減期が発生したときに通知します（210,000ブロックごと）。",
    notifyPrefTxConfirmed: "トランザクションが確認された",
    notifyPrefTxConfirmedDesc:
      "表示中のトランザクション、または表示中のアドレスのトランザクションが確認されたときに通知します。",
    notifyPrefAddressNewTx: "アドレスの新しいトランザクション",
    notifyPrefAddressNewTxDesc: "表示中のアドレスに新しいトランザクションが現れたときに通知します。",
    notifyNewBlock: "新しいブロックが採掘されました",
    notifyDifficulty: "難易度が調整されました",
    notifyHalving: "Bitcoinの半減期",
    notifyTxConfirmed: "トランザクションが確認されました",
    notifyAddressNewTx: "新しいトランザクション",
    notifyBodyBlock: "ブロック高: {height}",
    notifyBodyDifficulty: "ブロック {height} で難易度が再調整されました。",
    notifyBodyHalving:
      "ブロック {height} で報酬が半減しました。新しい報酬: {subsidy} BTC。",
    notifyBodyTx: "トランザクション {txid}",
    notifyBodyAddress: "アドレス {address}",
    notifyTestTitle: "通知が有効になりました",
    notifyTestBody:
      "このタブを開いたままにしておくと、Windowsに通知が表示されます。最小化はできますが、閉じないでください。",
    about: "このアプリについて",
    aboutClose: "閉じる",
    aboutLoading: "読み込み中…",
    aboutLoadError:
      "READMEを読み込めませんでした。プロジェクトのREADME.mdを開くか、GitHubで確認してください。",
    muteSounds: "音声をミュート",
    unmuteSounds: "音声をオン",
    soundsOn: "音声オン",
    soundsOff: "音声オフ",
    errorEmpty:
      "BitcoinまたはLiquidアドレス、サイレントペイメントアドレス、公開鍵、トランザクションID、Lightningチャネル、Lightningアドレス、またはLightningインボイスを入力してください。",
    errorInvalidPubkey:
      "公開鍵が無効です。圧縮形式（02/03...）または非圧縮形式（04...）の16進数キーを貼り付けてください。",
    errorInvalidSilentPayment:
      "サイレントペイメントアドレスが無効です。アドレスを確認して再試行してください。",
    errorIncompleteSilentPayment:
      "このサイレントペイメントアドレスは不完全のようです。BIP-352アドレスは約116文字（sp1…）です。完全なアドレスを貼り付けて再試行してください。",
    errorFetch:
      "残高を取得できませんでした。アドレスまたは公開鍵を確認して再試行してください。",
    errorLnChannelFetch:
      "Lightningチャネルを取得できませんでした。チャネルIDを確認して再試行してください。",
    errorLnAddressFetch:
      "Lightningアドレスを取得できませんでした。アドレスを確認して再試行してください。一部のプロバイダーはブラウザからのリクエスト（CORS）をブロックする場合があります。",
    errorLnInvoiceDecode:
      "Lightningインボイスを復号できませんでした。インボイスを確認して再試行してください。",
    errorLnInvoiceNoAddress:
      "インボイスを作成する前にLightningアドレスを検索してください。",
    errorLnInvoiceAmount: "有効な整数のsatoshi金額を入力してください。",
    errorLnInvoiceAmountLow: "金額がこのアドレスの最小値を下回っています。",
    errorLnInvoiceAmountHigh: "金額がこのアドレスの最大値を超えています。",
    errorLnInvoiceComment: "このアドレスはコメントを受け付けません。",
    errorLnInvoiceCommentLong: "コメントがこのアドレスの制限より長すぎます。",
    errorLnInvoiceInvalid: "プロバイダーが無効なインボイスを返しました。",
    errorLnInvoiceFetch:
      "インボイスを作成できませんでした。金額を確認して再試行してください。",
    confidential: "機密",
    errorQrLibrary:
      "QRコードライブラリの読み込みに失敗しました。ページを更新して再試行してください。",
    errorQrGenerate: "QRコードを生成できませんでした。再試行してください。",
    errorExportLibrary:
      "Excel書き出しライブラリの読み込みに失敗しました。ページを更新して再試行してください。",
    errorExportNoAddress:
      "書き出す前にアドレスまたは公開鍵を検索してください。",
    errorExportSilentPayment:
      "エクスプローラーはサイレントペイメントアドレスをスキャンできないため、トランザクションを書き出せません。",
    errorExportFetch:
      "トランザクションを書き出せませんでした。接続を確認して再試行してください。",
    errorExportEmpty: "このアドレスのトランザクションは見つかりませんでした。",
    yes: "はい",
    no: "いいえ",
    unknown: "不明",
    na: "N/A",
    btcUnconfirmed: "{amount} BTC 未確認",
    zeroSeconds: "0秒",
    unitYear: "年",
    unitYears: "年",
    unitMonth: "か月",
    unitMonths: "か月",
    unitDay: "日",
    unitDays: "日",
    unitHour: "時間",
    unitHours: "時間",
    unitMinute: "分",
    unitMinutes: "分",
    unitSecond: "秒",
    unitSeconds: "秒",
    am: "",
    pm: "",
  },
};

let currentLang = DEFAULT_LANG;
let currentCurrency = DEFAULT_CURRENCY;
const languageChangeListeners = [];
const currencyChangeListeners = [];
function t(key, vars = {}) {
  const table = translations[currentLang] ?? translations[DEFAULT_LANG];
  let text = table[key] ?? translations[DEFAULT_LANG][key] ?? key;

  for (const [name, value] of Object.entries(vars)) {
    text = text.replaceAll(`{${name}}`, value);
  }

  return text;
}

function getLocale() {
  return LANG_LOCALES[currentLang] || LANG_LOCALES[DEFAULT_LANG];
}

function getCurrentLang() {
  return currentLang;
}

function getDisplayCurrency() {
  return currentCurrency;
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

function loadCurrencyPreference() {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored && SUPPORTED_CURRENCIES.includes(stored)) {
      currentCurrency = stored;
      return;
    }
  } catch (err) {
    console.error(err);
  }

  currentCurrency = DEFAULT_CURRENCY;
}

function saveCurrencyPreference(currency) {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch (err) {
    console.error(err);
  }
}

const I18N_FIT_MIN_SCALE = 0.55;
const I18N_FIT_TOLERANCE_PX = 1;
const I18N_FIT_VIEW_SELECTOR = ".card.app-view";

let i18nFitGen = 0;
let i18nFitResizeTimer = 0;

function applyI18nStrings(root, lang) {
  root.lang = lang;
  const table = translations[lang] || translations[DEFAULT_LANG];
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    if (el.hasAttribute("data-i18n-attr")) return;
    const key = el.getAttribute("data-i18n");
    const text = table[key];
    if (typeof text === "string") el.textContent = text;
  });
}

function getViewMeasureWidth(viewEl) {
  if (viewEl.offsetWidth > 0) return viewEl.offsetWidth;
  const maxW = parseFloat(getComputedStyle(viewEl).maxWidth);
  const fallback = Number.isFinite(maxW) && maxW > 0 ? maxW : 520;
  return Math.min(fallback, Math.max(280, window.innerWidth - 48));
}

function createI18nMeasureClone(viewEl, width) {
  const clone = viewEl.cloneNode(true);
  clone.removeAttribute("id");
  clone.removeAttribute("hidden");
  clone.hidden = false;
  clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));

  clone.style.position = "fixed";
  clone.style.left = "0";
  clone.style.top = "0";
  clone.style.right = "auto";
  clone.style.bottom = "auto";
  clone.style.width = `${width}px`;
  clone.style.maxWidth = "none";
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.minHeight = "0";
  clone.style.margin = "0";
  clone.style.opacity = "0";
  clone.style.pointerEvents = "none";
  clone.style.zIndex = "-1";
  clone.style.display = "block";
  clone.style.overflow = "visible";

  document.body.appendChild(clone);
  return clone;
}

function resetI18nChromeFit(chrome) {
  chrome.style.fontSize = "";
  chrome.style.height = "";
  chrome.style.overflow = "";
}

function simplifyCloneForMeasure(clone) {
  clone.querySelectorAll(".stat-card__value").forEach((el) => {
    el.replaceChildren();
    el.textContent = "0.00";
  });
}

function fitViewHeightToEnglish(viewEl) {
  const chrome = viewEl.querySelector(".view-chrome");
  if (!chrome) return;
  resetI18nChromeFit(chrome);
  if (currentLang === DEFAULT_LANG) return;

  const width = getViewMeasureWidth(viewEl);
  const clone = createI18nMeasureClone(viewEl, width);
  const cloneChrome = clone.querySelector(".view-chrome") || clone;
  resetI18nChromeFit(cloneChrome);
  simplifyCloneForMeasure(clone);

  applyI18nStrings(clone, DEFAULT_LANG);
  const enHeight = cloneChrome.offsetHeight;
  if (!enHeight) {
    clone.remove();
    return;
  }

  applyI18nStrings(clone, currentLang);
  if (cloneChrome.offsetHeight <= enHeight + I18N_FIT_TOLERANCE_PX) {
    clone.remove();
    return;
  }

  const rootPx = parseFloat(getComputedStyle(cloneChrome).fontSize) || 16;
  let lo = rootPx * I18N_FIT_MIN_SCALE;
  let hi = rootPx;
  let best = lo;

  for (let i = 0; i < 14; i += 1) {
    const mid = (lo + hi) / 2;
    cloneChrome.style.fontSize = `${mid}px`;
    if (cloneChrome.offsetHeight <= enHeight + I18N_FIT_TOLERANCE_PX) {
      best = mid;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  chrome.style.fontSize = `${best.toFixed(2)}px`;
  clone.remove();
}

function fitI18nText() {
  document.querySelectorAll(".view-chrome").forEach((chrome) => {
    resetI18nChromeFit(chrome);
  });
  if (currentLang === DEFAULT_LANG) return;
  document.querySelectorAll(I18N_FIT_VIEW_SELECTOR).forEach((viewEl) => {
    if (viewEl.hidden) return;
    if (!viewEl.querySelector(".view-chrome")) return;
    fitViewHeightToEnglish(viewEl);
  });
}

function scheduleI18nFit() {
  const gen = ++i18nFitGen;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (gen !== i18nFitGen) return;
      fitI18nText();
    });
  });
}

function bindI18nFitEvents() {
  window.addEventListener("resize", () => {
    if (i18nFitResizeTimer) window.clearTimeout(i18nFitResizeTimer);
    i18nFitResizeTimer = window.setTimeout(() => {
      i18nFitResizeTimer = 0;
      scheduleI18nFit();
    }, 100);
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => scheduleI18nFit()).catch(() => {});
  }
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLang;
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

  updateSettingsUi();
  scheduleI18nFit();
}

function updateSettingsUi() {
  const settingsLangFlag = document.getElementById("settingsLangFlag");
  if (settingsLangFlag) {
    SUPPORTED_LANGS.forEach((lang) => {
      settingsLangFlag.classList.remove(`settings-menu__flag--${lang}`);
    });
    if (SUPPORTED_LANGS.includes(currentLang)) {
      settingsLangFlag.classList.add(`settings-menu__flag--${currentLang}`);
    }
  }

  const settingsCurrencyValue = document.getElementById("settingsCurrencyValue");
  if (settingsCurrencyValue) {
    settingsCurrencyValue.textContent = currentCurrency;
  }

  document.querySelectorAll(".lang-menu__option").forEach((option) => {
    const isSelected = option.dataset.lang === currentLang;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });

  document.querySelectorAll(".currency-menu__option").forEach((option) => {
    const isSelected = option.dataset.currency === currentCurrency;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });

  if (typeof updateNotificationsUi === "function") {
    updateNotificationsUi();
  }
}

const SETTINGS_PANELS = ["language", "currency", "notifications", "about"];
let currentSettingsPanel = "language";

function loadSettingsAboutPanel() {
  const aboutBody = document.getElementById("settingsAboutBody");
  if (!aboutBody) return;

  const text = getAboutText();
  if (text) {
    aboutBody.innerHTML = renderAboutHtml(text);
    aboutBody.scrollTop = 0;
    return;
  }

  aboutBody.innerHTML = `<p class="about-modal__error">${escapeHtml(t("aboutLoadError"))}</p>`;
}

const SETTINGS_PANEL_IDS = {
  language: "settingsPanelLanguage",
  currency: "settingsPanelCurrency",
  notifications: "settingsPanelNotifications",
  about: "settingsPanelAbout",
};

function setSettingsPanel(panel) {
  if (!SETTINGS_PANELS.includes(panel)) return;
  if (
    panel === "notifications" &&
    typeof isNotificationApiAvailable === "function" &&
    !isNotificationApiAvailable()
  ) {
    return;
  }
  currentSettingsPanel = panel;

  document.querySelectorAll(".settings-menu__nav-item").forEach((item) => {
    const isActive = item.dataset.settingsPanel === panel;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-selected", String(isActive));
  });

  Object.entries(SETTINGS_PANEL_IDS).forEach(([name, id]) => {
    const section = document.getElementById(id);
    if (section) section.hidden = name !== panel;
  });

  if (panel === "about") {
    loadSettingsAboutPanel();
  }
}

function getCurrentSettingsPanel() {
  return currentSettingsPanel;
}

function closeSettingsMenu() {
  if (typeof showAppView === "function") {
    const settingsView = document.getElementById("settingsView");
    if (settingsView && !settingsView.hidden) {
      showAppView("check");
    }
  }
}

function openSettingsMenu() {
  if (typeof showAppView === "function") {
    showAppView("settings");
    return;
  }
  setSettingsPanel(currentSettingsPanel || "language");
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
  scheduleI18nFit();
}

function setCurrency(currency) {
  if (!SUPPORTED_CURRENCIES.includes(currency) || currency === currentCurrency) {
    return;
  }

  currentCurrency = currency;
  saveCurrencyPreference(currency);
  updateSettingsUi();
  currencyChangeListeners.forEach((listener) => listener(currency));
}

function onLanguageChange(listener) {
  languageChangeListeners.push(listener);
}

function onCurrencyChange(listener) {
  currencyChangeListeners.push(listener);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderAboutHtml(text) {
  const escaped = escapeHtml(text);
  // Preserve monospaced readability without a full markdown parser.
  return `<pre class="about-modal__readme">${escaped}</pre>`;
}

function getAboutText() {
  // Embedded in about.js (copy of README.md) so About works offline and via file://.
  if (typeof window.ABOUT_TEXT === "string" && window.ABOUT_TEXT.trim()) {
    return window.ABOUT_TEXT;
  }
  return "";
}

function hideAboutModal() {
  const aboutOverlay = document.getElementById("aboutOverlay");
  if (!aboutOverlay) return;
  aboutOverlay.hidden = true;
}

function showAboutModal() {
  const aboutOverlay = document.getElementById("aboutOverlay");
  const aboutBody = document.getElementById("aboutBody");
  if (!aboutOverlay || !aboutBody) return;

  closeSettingsMenu();
  aboutOverlay.hidden = false;

  const text = getAboutText();
  if (text) {
    aboutBody.innerHTML = renderAboutHtml(text);
    aboutBody.scrollTop = 0;
    return;
  }

  aboutBody.innerHTML = `<p class="about-modal__error">${escapeHtml(t("aboutLoadError"))}</p>`;
}

function initSettings() {
  loadLanguagePreference();
  loadCurrencyPreference();
  applyStaticTranslations();

  const settingsMenu = document.getElementById("settingsMenu");
  const langMenu = document.getElementById("langMenu");
  const currencyMenu = document.getElementById("currencyMenu");
  const notifyMenu = document.getElementById("notifyMenu");
  const aboutOverlay = document.getElementById("aboutOverlay");
  const aboutModal = document.getElementById("aboutModal");
  const aboutCloseBtn = document.getElementById("aboutCloseBtn");

  if (!settingsMenu) return;

  settingsMenu.querySelectorAll(".settings-menu__nav-item").forEach((item) => {
    item.addEventListener("click", (event) => {
      event.stopPropagation();
      if (item.disabled) return;
      setSettingsPanel(item.dataset.settingsPanel);
    });
  });

  notifyMenu?.querySelectorAll(".notifications-menu__option").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      if (option.disabled) return;
      const type = option.dataset.notify;
      if (!type || typeof setNotificationEnabled !== "function") return;

      const next = option.getAttribute("aria-checked") !== "true";
      void (async () => {
        await setNotificationEnabled(type, next);
        if (typeof updateNotificationsUi === "function") {
          updateNotificationsUi();
        }
      })();
    });
  });

  langMenu?.querySelectorAll(".lang-menu__option").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      setLanguage(option.dataset.lang);
    });
  });

  currencyMenu?.querySelectorAll(".currency-menu__option").forEach((option) => {
    option.addEventListener("click", (event) => {
      event.stopPropagation();
      setCurrency(option.dataset.currency);
    });
  });

  aboutCloseBtn?.addEventListener("click", (event) => {
    event.stopPropagation();
    hideAboutModal();
  });

  aboutOverlay?.addEventListener("click", (event) => {
    // Close when clicking the dimmed backdrop (outside the modal panel).
    if (event.target === aboutOverlay) {
      hideAboutModal();
    }
  });

  aboutModal?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;

    if (aboutOverlay && !aboutOverlay.hidden) {
      hideAboutModal();
    }
  });

  bindI18nFitEvents();
}

initSettings();

window.t = window.t || t;
window.getLocale = getLocale;
window.getCurrentLang = getCurrentLang;
window.getDisplayCurrency = getDisplayCurrency;
window.setLanguage = setLanguage;
window.setCurrency = setCurrency;
window.onLanguageChange = onLanguageChange;
window.onCurrencyChange = onCurrencyChange;
window.showAboutModal = showAboutModal;
window.hideAboutModal = hideAboutModal;
window.setSettingsPanel = setSettingsPanel;
window.getCurrentSettingsPanel = getCurrentSettingsPanel;
window.fitI18nText = fitI18nText;
window.scheduleI18nFit = scheduleI18nFit;