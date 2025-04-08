import VideoUploader from '@/components/video-uploader'
import { ThemeProvider } from '@/components/theme-provider'

export default function Home () {
  return (
    <ThemeProvider attribute='class' defaultTheme='light' forcedTheme='light'>
      <main className='min-h-screen bg-gray-50 p-4 md:p-8'>
        <div className='mx-auto max-w-6xl'>
          <VideoUploader />
        </div>
      </main>
    </ThemeProvider>
  )
}
