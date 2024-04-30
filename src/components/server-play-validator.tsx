import { type ReactNode, useState } from "react"
import { toast } from "sonner"
import { useRouter } from "@tanstack/react-router"
import { invoke } from "@tauri-apps/api/core"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { type Server } from "@/schemas/server-schema"
import { useModDownloadQueue } from "@/stores/mod-download-queue"
import { ScrollArea } from "./ui/scroll-area"

interface ServerPlayValidatorProps {
  server: Server
  children?: ReactNode
}

export function ServerPlayValidator({
  server,
  children,
}: ServerPlayValidatorProps) {
  const [isMissingMods, setIsMissingMods] = useState(false)
  const [missingMods, setMissingMods] = useState<number[] | null>(null)
  const { pushMod } = useModDownloadQueue()
  const navigate = useRouter().navigate

  const handleChange = (e: boolean) => {
    setIsMissingMods(e)
  }

  const handleDownload = async () => {
    if (!server.modList) return
    if (!missingMods) return

    for (const mod of missingMods) {
      invoke("mdq_mod_add", { publishedFileId: mod }).catch(console.error)

      // Catch a name
      let name = server.modList.find((m) => m.workshopId === mod)?.name
      if (!name) name = "Unknown Mod"

      pushMod({ workshopId: mod, name: name }).catch(console.error)
    }

    navigate({ to: "/mod-manager" }).catch(console.error)
  }

  const handlePlay = async () => {
    if (!server.modList) return

    const missing = await invoke("steam_get_missing_mods_for_server", {
      requiredMods: server.modList.map((mod) => mod.workshopId),
    }).catch(console.error)
    const missingMods = missing as number[]

    if (missingMods.length > 0) {
      setIsMissingMods(true)
      setMissingMods(missingMods)
      return
    }

    const success = await invoke("dayz_launch_modded", { server: server }).catch(
      console.error
    )
    if (success === null) {
      const shortName =
        server.name.length > 45
          ? server.name.substring(0, 45) + "..."
          : server.name

      toast.success("Successfully loaded mods & launched DayZ", {
        description: shortName,
        position: "bottom-center",
      })
    }
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger>{children}</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="max-w-[450px] truncate">
              {server.name}
              <p
                className="truncate text-sm font-normal
                  text-secondary-foreground"
              >
                {server.addr.split(":")[0] + ":" + server.gamePort}
              </p>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to connect to this server! If you do not have the
              mods for this server downloaded, we'll download them for you.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePlay}>Play</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={isMissingMods} onOpenChange={handleChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="max-w-[450px] truncate">
              Uh oh! You're missing some mods! 😥
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div
                className="max-w-fit truncate pb-2 text-sm font-normal
                  text-secondary-foreground"
              >
                <div>{server.name}</div>
                <div className="text-xs text-gray-500">
                  {server.addr.split(":")[0] + ":" + server.gamePort}
                </div>
              </div>
              <ScrollArea
                className="max-h-[20vh] overflow-y-visible rounded-md border
                  pb-2 pl-2 pt-1 text-accent-foreground"
              >
                {missingMods?.map((mod, idx) => (
                  <div key={idx}>
                    {server.modList?.find((m) => m.workshopId === mod)?.name}
                  </div>
                ))}
              </ScrollArea>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDownload}>
              Download
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}