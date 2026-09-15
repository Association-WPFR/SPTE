// Icône et popup actifs uniquement sur translate.wordpress.org, désactivés ailleurs.
export default defineBackground(() => {
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    browser.action.disable();

    if (!tab.url || !/https:\/\/translate\.wordpress\.org\//.test(tab.url)) {
      return;
    }
    browser.action.enable();

    if (changeInfo.status) {
      browser.action.setPopup({
        tabId,
        popup: 'popup.html',
      });
    }
  });
});
