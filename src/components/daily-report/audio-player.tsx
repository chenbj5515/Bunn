'use client'

import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { speakText } from '@/utils'

interface AudioPlayerProps {
  originalText: string
}

export function AudioPlayer({ originalText }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  function handlePlayBtn() {
    if (!isPlaying && originalText) {
      speakText(originalText, {
        voicerName: "ja-JP-NanamiNeural"
      }, () => setIsPlaying(false));
      setIsPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="rounded-full w-8 h-8 p-0"
        onClick={handlePlayBtn}
        disabled={isPlaying}
      >
        {isPlaying ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}