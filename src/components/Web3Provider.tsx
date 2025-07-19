import React from 'react'
import { modal } from '@/lib/web3'

interface Web3ProviderProps {
  children: React.ReactNode
}

export const Web3Provider: React.FC<Web3ProviderProps> = ({ children }) => {
  return (
    <>
      {children}
    </>
  )
}