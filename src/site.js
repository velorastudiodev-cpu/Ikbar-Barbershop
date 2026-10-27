import { createContext, useContext } from 'react'
import { FALLBACK } from './data.js'

export const SiteContext = createContext(FALLBACK)
export const useSite = () => useContext(SiteContext)
