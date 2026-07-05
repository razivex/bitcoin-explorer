function renderBalanceSubLine(text, { showArrows = false } = {}) {
  AppDom.balanceUnconfirmedEl.replaceChildren();

  if (
    showArrows &&
    (AppState.balanceSubState.arrowUp || AppState.balanceSubState.arrowDown)
  ) {
    const arrows = document.createElement("span");
    arrows.className = "balance-unconfirmed__arrows";
    arrows.setAttribute("aria-hidden", "true");

    if (AppState.balanceSubState.arrowUp) {
      const upArrow = document.createElement("span");
      upArrow.className = "balance-arrow balance-arrow--up";
      upArrow.textContent = "▲";
      arrows.appendChild(upArrow);
    }

    if (AppState.balanceSubState.arrowDown) {
      const downArrow = document.createElement("span");
      downArrow.className = "balance-arrow balance-arrow--down";
      downArrow.textContent = "▼";
      arrows.appendChild(downArrow);
    }

    AppDom.balanceUnconfirmedEl.appendChild(arrows);
  }

  const textSpan = document.createElement("span");
  textSpan.className = "balance-unconfirmed__text";
  textSpan.textContent = text;
  AppDom.balanceUnconfirmedEl.appendChild(textSpan);
}

function setBalanceSubText(text, animate = true, { showArrows = false } = {}) {
  if (!animate) {
    renderBalanceSubLine(text, { showArrows });
    AppDom.balanceUnconfirmedEl.classList.remove("is-fading");
    return;
  }

  AppDom.balanceUnconfirmedEl.classList.add("is-fading");

  setTimeout(() => {
    renderBalanceSubLine(text, { showArrows });
    AppDom.balanceUnconfirmedEl.classList.remove("is-fading");
  }, AppConstants.BALANCE_SUB_FADE_MS);
}

function startBalanceSubCycle(usdText, unconfirmedText) {
  stopBalanceSubCycle();

  AppState.balanceSubState = {
    hasUnconfirmed: true,
    showingUsd: true,
    usdText,
    unconfirmedText,
    arrowUp: AppState.balanceSubState.arrowUp,
    arrowDown: AppState.balanceSubState.arrowDown,
  };

  renderBalanceSubLine(usdText);
  AppDom.balanceUnconfirmedEl.classList.remove("is-fading");

  AppState.balanceSubInterval = setInterval(() => {
    AppState.balanceSubState.showingUsd = !AppState.balanceSubState.showingUsd;
    const showingUnconfirmed = !AppState.balanceSubState.showingUsd;
    setBalanceSubText(
      showingUnconfirmed
        ? AppState.balanceSubState.unconfirmedText
        : AppState.balanceSubState.usdText,
      true,
      { showArrows: showingUnconfirmed },
    );
  }, AppConstants.UPDATE_INTERVAL_MS);
}

function setupBalanceSub(
  confirmedBtc,
  unconfirmedSats,
  unconfirmedBtc,
  fiatPrice,
  mempoolStats,
) {
  stopBalanceSubCycle();

  const fiatText = buildFiatText(confirmedBtc);
  AppState.balanceSubState.usdText = fiatText;

  if (hasUnconfirmedActivity(unconfirmedSats, mempoolStats)) {
    const unconfirmedText = formatUnconfirmedText(
      unconfirmedSats,
      unconfirmedBtc,
    );
    startBalanceSubCycle(fiatText, unconfirmedText);
    return;
  }

  AppState.balanceSubState = {
    hasUnconfirmed: false,
    showingUsd: true,
    usdText: fiatText,
    unconfirmedText: "",
    arrowUp: false,
    arrowDown: false,
  };
  renderBalanceSubLine(fiatText);
  AppDom.balanceUnconfirmedEl.classList.remove("is-fading");
}

function updateBalanceSubSilently(
  confirmedBtc,
  unconfirmedSats,
  unconfirmedBtc,
  fiatPrice,
  mempoolStats,
) {
  const fiatText = buildFiatText(confirmedBtc);
  const hasUnconfirmed = hasUnconfirmedActivity(unconfirmedSats, mempoolStats);
  const unconfirmedText = hasUnconfirmed
    ? formatUnconfirmedText(unconfirmedSats, unconfirmedBtc)
    : "";

  if (hasUnconfirmed !== AppState.balanceSubState.hasUnconfirmed) {
    setupBalanceSub(
      confirmedBtc,
      unconfirmedSats,
      unconfirmedBtc,
      fiatPrice,
      mempoolStats,
    );
    return;
  }

  AppState.balanceSubState.usdText = fiatText;
  AppState.balanceSubState.unconfirmedText = unconfirmedText;

  if (!hasUnconfirmed) {
    renderBalanceSubLine(fiatText);
    return;
  }

  const showingUnconfirmed = !AppState.balanceSubState.showingUsd;
  const visibleText = showingUnconfirmed
    ? AppState.balanceSubState.unconfirmedText
    : AppState.balanceSubState.usdText;
  setBalanceSubText(visibleText, false, { showArrows: showingUnconfirmed });
}

window.renderBalanceSubLine = renderBalanceSubLine;
window.setBalanceSubText = setBalanceSubText;
window.startBalanceSubCycle = startBalanceSubCycle;
window.setupBalanceSub = setupBalanceSub;
window.updateBalanceSubSilently = updateBalanceSubSilently;