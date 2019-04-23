const defaultPort = 3000
export const PORT =
  parseInt(process.env.PORT || `${defaultPort}`, 10) || defaultPort
