// Test script to verify period aggregation logic

const testData = [
  { y: 2020, q: 1, m: 11001, ren: 100 },
  { y: 2020, q: 2, m: 11001, ren: 150 },
  { y: 2020, q: 3, m: 11001, ren: 120 },
  { y: 2020, q: 4, m: 11001, ren: 130 },
  { y: 2021, q: 1, m: 11001, ren: 110 },
  { y: 2021, q: 2, m: 11001, ren: 140 },
]

function aggregateByPeriod(data, timeRange) {
  const agg = new Map()

  data.forEach(d => {
    let key
    if (timeRange === 'yearly') {
      key = `${d.y}`
    } else if (timeRange === 'monthly' && d.mo) {
      key = `${d.y}-${String(d.mo).padStart(2, '0')}`
    } else {
      key = `${d.y}-${d.q}`
    }

    const prev = agg.get(key)
    if (!prev) {
      agg.set(key, { key, value: d.ren })
    } else {
      prev.value += d.ren
    }
  })

  return Array.from(agg.values())
}

console.log('Test data:', testData)
console.log('\nQuarterly aggregation:')
console.log(aggregateByPeriod(testData, 'quarterly'))

console.log('\nYearly aggregation:')
console.log(aggregateByPeriod(testData, 'yearly'))
