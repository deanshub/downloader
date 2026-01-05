- TODO: support search through prowlarr - use arr-sdk npm package to allow searching through prowlarr in addition to the current search
when setting env vars of PROWLARR_BASE_URL and PROWLARR_API_KEY combine results from the original search with the results of ProwlarrClient
example usage
```
import { ProwlarrClient } from 'arr-sdk/prowlarr'

const prowlarr = new ProwlarrClient({
  baseUrl: 'http://localhost:9696',
  apiKey: 'your-api-key'
})

// Get all indexers
const indexers = await prowlarr.indexer.getAll()

// Search across indexers
const results = await prowlarr.search.query({
  query: 'ubuntu',
  type: 'search'
})
```
