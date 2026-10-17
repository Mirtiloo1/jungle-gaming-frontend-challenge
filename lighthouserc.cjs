module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run preview:lighthouse:mobile',
      startServerReadyPattern: 'Local:',
      url: ['http://localhost:4182/', 'http://localhost:4182/nfts/nft-001'],
      numberOfRuns: 3,
      settings: { preset: 'perf' },
      storage: { target: '.lighthouseci/mobile' },
    },
  },
}
