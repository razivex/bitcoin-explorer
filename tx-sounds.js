function resetTxWatchState() {
  AppState.txWatchState = {
    initialized: false,
    chainTxCount: 0,
    mempoolTxCount: 0,
    lastConfirmedTxId: null,
  };
}

function resetTxConfirmationWatchState() {
  AppState.txConfirmationWatchState = {
    initialized: false,
    confirmed: false,
  };
}

function detectAndPlayTxConfirmationSound(data, { silent = false } = {}) {
  const confirmed = Boolean(data.confirmed);

  if (!silent || !AppState.txConfirmationWatchState.initialized) {
    AppState.txConfirmationWatchState = {
      initialized: true,
      confirmed,
    };
    return;
  }

  if (confirmed && !AppState.txConfirmationWatchState.confirmed) {
    playConfirmedSound();
  }

  AppState.txConfirmationWatchState = {
    initialized: true,
    confirmed,
  };
}

function detectAndPlayTxSounds(data, { silent = false } = {}) {
  const chainTxCount = data.txCount;
  const mempoolTxCount = data.mempoolTxCount;
  const lastConfirmedTxId = data.lastConfirmedTxId;

  if (!silent || !AppState.txWatchState.initialized) {
    AppState.txWatchState = {
      initialized: true,
      chainTxCount,
      mempoolTxCount,
      lastConfirmedTxId,
    };
    return;
  }

  const newConfirmed =
    chainTxCount > AppState.txWatchState.chainTxCount ||
    (lastConfirmedTxId &&
      lastConfirmedTxId !== AppState.txWatchState.lastConfirmedTxId);
  const newUnconfirmed = mempoolTxCount > AppState.txWatchState.mempoolTxCount;

  if (newConfirmed) {
    playConfirmedSound();
  } else if (newUnconfirmed) {
    playBellSound();
    if (!isMempoolSocketConnected()) {
      const newAddressTxCount =
        mempoolTxCount - AppState.txWatchState.mempoolTxCount;
      spawnAddressBlocks(newAddressTxCount);
    }
  }

  AppState.txWatchState = {
    initialized: true,
    chainTxCount,
    mempoolTxCount,
    lastConfirmedTxId,
  };
}

window.resetTxWatchState = resetTxWatchState;
window.resetTxConfirmationWatchState = resetTxConfirmationWatchState;
window.detectAndPlayTxConfirmationSound = detectAndPlayTxConfirmationSound;
window.detectAndPlayTxSounds = detectAndPlayTxSounds;