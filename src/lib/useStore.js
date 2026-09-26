import { useEffect, useRef, useState } from 'react'
import { makeDb } from './db.js'
/** État persistant : useStore('depenses', 'transactions', []) */
export function useStore(app, name, initial) {
  const db = useRef(makeDb(app)).current
  const [v, setV] = useState(() => db.read(name, initial))
  useEffect(() => { db.write(name, v) }, [v])
  return [v, setV]
}
