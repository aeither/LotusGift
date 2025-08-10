'use client'

import * as React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/src/lib/utils'

export type EnvelopeProps = {
  recipient?: string
  amount?: number | string
  message?: string
  className?: string
}

const EnvelopeCard: React.FC<EnvelopeProps> = ({
  recipient = 'Bạn hiền',
  amount = 88000,
  message = 'Chúc mừng năm mới! An khang thịnh vượng.',
  className,
}) => {
  const [opened, setOpened] = React.useState(false)

  return (
    <Card
      role="button"
      aria-label={opened ? 'Đã mở phong bao lì xì' : 'Mở phong bao lì xì'}
      onClick={() => setOpened((v) => !v)}
      className={cn(
        'relative mx-auto max-w-sm overflow-hidden border border-red-200 bg-gradient-to-b from-red-600 to-red-500 text-white rounded-xl shadow-sm hover:scale-[1.01] transition-transform',
        className,
      )}
    >
      <CardContent className="p-5">
        <div className="relative">
          <div
            className={cn(
              'mx-auto h-24 w-full max-w-[360px] rounded-t-lg bg-red-500',
              opened ? 'translate-y-[-110%] transition-transform duration-300 ease-out' : '',
            )}
          />

          <div className="mx-auto max-w-[360px] rounded-lg bg-white/10 p-4 backdrop-blur-[2px] border border-white/20">
            <div className="flex items-center justify-between text-sm/6 opacity-90">
              <span>Gửi đến</span>
              <span className="font-semibold">{recipient}</span>
            </div>
            <div className="mt-2 text-center">
              <div className="text-xs opacity-90">Số tiền may mắn</div>
              <div className="text-3xl font-bold tracking-tight">
                {new Intl.NumberFormat('vi-VN').format(Number(amount))}₫
              </div>
            </div>
            <p className="mt-3 text-center text-sm opacity-90">{message}</p>
          </div>

          <div className="mt-3 text-center text-xs opacity-80">
            {opened ? 'Chạm để đóng lại' : 'Chạm để mở bao lì xì'}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EnvelopeCard


