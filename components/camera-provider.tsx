"use client"

import { createContext, useContext, useState, useEffect } from "react"
import CameraModal from "./camera-modal"

type Camera = {
  _id: string
  name: string
  streamUrl: string
  location: string
  status: string
  lastSeen?: string
}

type CameraContextType = {
  editCamera: (camera: Camera) => void
  isScreenSharing: boolean
  toggleScreenShare: () => void
  screenStream: MediaStream | null
}

const CameraContext = createContext<CameraContextType | null>(null)

export function useCameraContext() {
  const context = useContext(CameraContext)
  if (!context) throw new Error("useCameraContext must be used within CameraProvider")
  return context
}

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)

  function editCamera(camera: Camera) {
    setSelectedCamera(camera)
    setIsModalOpen(true)
  }

  function handleClose() {
    setIsModalOpen(false)
    setSelectedCamera(null)
  }

  function handleSave() {
    window.dispatchEvent(new CustomEvent("cameras:refresh"))
  }

  function handleDelete() {
    window.dispatchEvent(new CustomEvent("cameras:refresh"))
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenSharing()
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          } as MediaTrackConstraints,
          audio: false,
        })
        setScreenStream(stream)
        setIsScreenSharing(true)

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          stopScreenSharing()
        }
      } catch (err) {
        console.error('Error sharing screen:', err)
      }
    }
  }

  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop())
      setScreenStream(null)
    }
    setIsScreenSharing(false)
  }

  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop())
      }
    }
  }, [screenStream])

  return (
    <CameraContext.Provider value={{ 
      editCamera,
      isScreenSharing,
      toggleScreenShare,
      screenStream
    }}>
      {children}
      {isModalOpen && (
        <CameraModal
          camera={selectedCamera || undefined}
          onClose={handleClose}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </CameraContext.Provider>
  )
}

export function AddCameraButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        className="border border-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition-colors"
        onClick={() => setIsModalOpen(true)}
      >
        Add Camera
      </button>
      {isModalOpen && (
        <CameraModal
          onClose={() => setIsModalOpen(false)}
          onSave={() => {
            setIsModalOpen(false)
            window.dispatchEvent(new CustomEvent("cameras:refresh"))
          }}
        />
      )}
    </>
  )
}
