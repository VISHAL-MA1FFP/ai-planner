Deno.test('project has the expected app files', async () => {
  const requiredFiles = [
    'src/App.jsx',
    'src/App.css',
    'src/index.css',
    'server.js',
    'package.json',
  ]

  for (const file of requiredFiles) {
    const info = await Deno.stat(file)
    if (!info.isFile) {
      throw new Error(`${file} should be a file`)
    }
  }
})
