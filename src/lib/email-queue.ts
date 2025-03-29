import { sendVerificationEmail } from './mail'

interface EmailQueueItem {
  to: string
  otp: string
  type: 'verification'
  retries?: number
}

class EmailQueue {
  private queue: EmailQueueItem[] = []
  private isProcessing: boolean = false
  private maxRetries: number = 3
  private processingInterval: number = 1000 // 1 second

  constructor() {
    this.startProcessing()
  }

  private async startProcessing() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (true) {
      if (this.queue.length > 0) {
        const item = this.queue.shift()
        if (item) {
          try {
            await this.processEmail(item)
          } catch (error) {
            console.error('Failed to process email:', error)
            if (item.retries && item.retries < this.maxRetries) {
              item.retries++
              this.queue.push(item)
            }
          }
        }
      }
      await new Promise(resolve => setTimeout(resolve, this.processingInterval))
    }
  }

  private async processEmail(item: EmailQueueItem) {
    switch (item.type) {
      case 'verification':
        await sendVerificationEmail({ to: item.to, otp: item.otp })
        break
      // Add more email types here
    }
  }

  public async addToQueue(item: EmailQueueItem) {
    this.queue.push(item)
  }

  public getQueueLength(): number {
    return this.queue.length
  }
}

// Create a singleton instance
export const emailQueue = new EmailQueue() 