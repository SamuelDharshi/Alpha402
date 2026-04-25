'use client'
import { useEffect } from 'react'
import { useTradeDeskStore } from '@/lib/store'

export default function WSConnector() {
  const connect = useTradeDeskStore(state => state.connect)
  useEffect(() => { connect() }, [connect])
  return null
}
