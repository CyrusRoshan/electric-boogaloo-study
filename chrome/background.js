setInterval(() => {
  doInCurrentTab((tab) => {
    if (!tab || !tab.url || tab.url.startsWith('chrome://')) {
      return
    }

    chrome.tabs.executeScript(tab.id, {code: `document.body.innerText`}, (result) => {
      var text = result[0].replace(/\s+/g, ' ');

      var xhr = new XMLHttpRequest();
      xhr.open('POST', 'http://localhost:3000', true);
      xhr.setRequestHeader('Content-type', 'application/json');
      xhr.send(JSON.stringify({
        text,
        url: tab.url,
      }));
    })
  })
}, 1000)

function doInCurrentTab(tabCallback) {
  chrome.tabs.query({ currentWindow: true, active: true }, function (tabArray) {
    tabCallback(tabArray[0])
  });
}
