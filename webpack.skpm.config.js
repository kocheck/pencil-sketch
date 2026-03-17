module.exports = (config) => {
  config.module.rules.push({
    test: /\.tsx?$/,
    use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
    exclude: /node_modules/,
  })
  config.resolve.extensions.push('.ts', '.tsx')
  return config
}
