"use client"
import { IceCreamIcon, MinusIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { serverSchema } from "../data/schema"
import { Row, Table } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { invoke } from "@tauri-apps/api/core"
import { useServerListStore } from "@/stores/server-list-store"

interface DataTableRowActionsProps<TData> {
  row: Row<TData>
}

export function DataTablePingView<TData>({
  row,
}: DataTableRowActionsProps<TData>) {
  const server = serverSchema.parse(row.original)
  const updateServer = useServerListStore((state) => state.updateServer)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    if (server.Ping !== 0) {
      console.log("ping already exists")
      setLoading(false)
      return
    }

    const getPing = async () => {
      const response: string = await invoke("ping_server", {
        serverIp: server.addr,
      })
      return response
    }

    getPing().then((ping) => {
      if (ping === "Offline") {
        // make the ping some high number so it's at the bottom of the list
        // the api also returns 99999 if the server is offline
        const newPing = 99999
        const newServer = { ...server, Ping: newPing }
        setLoading(false)
        updateServer(newServer)
        return
      }

      const newPing = parseInt(ping)
      const newServer = { ...server, Ping: newPing }
      setLoading(false)
      updateServer(newServer)
    })
  }, [])

  return (
    <div className="">
      {isLoading && <Spinner />}

      {!isLoading && row.getValue("Ping") !== 99999 && (
        <PingColored ping={row.getValue("Ping")} />
      )}

      {!isLoading && row.getValue("Ping") === 99999 && (
        <div className="text-gray-500">
          <span>Offline</span>
        </div>
      )}
    </div>
  )
}

function PingColored({ ping }: { ping: number }) {
  if (ping <= 25) {
    return (
      <div className="text-green-400">
        <span>{ping}ms</span>
      </div>
    )
  }

  if (25 <= ping && ping <= 50) {
    return (
      <div className="text-green-600">
        <span>{ping}ms</span>
      </div>
    )
  }

  if (51 <= ping && ping <= 100) {
    return (
      <div className="text-yellow-300">
        <span>{ping}ms</span>
      </div>
    )
  }

  if (101 <= ping && ping <= 150) {
    return (
      <div className="text-yellow-600">
        <span>{ping}ms</span>
      </div>
    )
  }

  if (151 <= ping && ping <= 200) {
    return (
      <div className="text-red-300">
        <span>{ping}ms</span>
      </div>
    )
  }

  if (201 <= ping && ping <= 250) {
    return (
      <div className="text-red-500">
        <span>{ping}ms</span>
      </div>
    )
  }

  if (251 <= ping) {
    return (
      <div className="text-red-700">
        <span>{ping}ms</span>
      </div>
    )
  }
}

function Spinner() {
  return (
    <div role="status">
      <svg
        className="h-5 w-5 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
        viewBox="0 0 100 101"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
          fill="currentColor"
        />
        <path
          d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
          fill="currentFill"
        />
      </svg>
    </div>
  )
}
