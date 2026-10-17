module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview:lighthouse:desktop',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4183/', 'http://localhost:4183/nfts/nft-001'],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        formFactor: 'desktop',
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
      },
      storage: { target: '.lighthouseci/desktop' },
    },
  },
}
