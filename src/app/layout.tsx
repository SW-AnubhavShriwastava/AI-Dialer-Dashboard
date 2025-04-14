import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'SNB Connect Dashboard',
  description: 'Manage your AI dialing campaigns',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-white min-h-screen antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
