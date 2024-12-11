import { VideoCreationForm } from "@/components/video/creation-form"

export default function CreatePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-text-primary mb-8">Create New Video</h1>
      <VideoCreationForm />
    </div>
  )
} 