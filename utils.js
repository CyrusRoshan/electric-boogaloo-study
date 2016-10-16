const notifier = require('node-notifier');

module.exports = {
  alert: function alert(title, message, icon) {
    notifier.notify({
      title,
      message,
      icon,
      sound: true,
      wait: false
    })
  },

  urlBlacklist: [
    'facebook.com',
    'twitter.com',
    'instagram.com',
    'reddit.com',
    'youtube.com',
    'slither.io',
    'agar.io',
    'ycombinator.com',
  ],

  urlWhitelist: [
    '.edu',
    'wikipedia.org',
    'github.com',
    'docs.google.com',
  ],

  windowBlacklist: [
    'messages',
    'spotify',
    'league',
  ],

  windowWhitelist: [
    'pages',
    'word',
    'atom',
    'arduino',
  ],
}
