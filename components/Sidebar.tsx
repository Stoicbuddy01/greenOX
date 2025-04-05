import Link from "next/link"
import { usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Trash,
  Coins,
  Medal,
  Settings,
  Home,
  Info,
} from "lucide-react"

const sidebarItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/report", icon: MapPin, label: "Report Waste" },
  { href: "/collect", icon: Trash, label: "Collect Waste" },
  { href: "/rewards", icon: Coins, label: "Rewards" },
  { href: "/leaderboard", icon: Medal, label: "Leaderboard" },
  { href: "/about", icon: Info, label: "About" },
]

interface SidebarProps {
  open: boolean
}

export default function Sidebar({ open }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={`bg-white border-r pt-20 border-gray-200 text-gray-800 w-64 fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out shadow-lg
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
    >
      <nav className="h-full flex flex-col justify-between">
        <div className="px-4 py-6 space-y-3">
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} passHref>
                <div
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                    ${isActive
                      ? "bg-green-100 text-green-800 border-l-4 border-green-600"
                      : "hover:bg-gray-100 text-gray-600"
                    }`}
                >
                  <Icon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-base font-medium">{item.label}</span>
                </div>
              </Link>
            )
          })}
        </div>
        <div className="p-4 border-t border-gray-200">
          <Link href="/settings" passHref>
            <div
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group
                ${pathname === "/settings"
                  ? "bg-green-100 text-green-800 border-l-4 border-green-600"
                  : "hover:bg-gray-100 text-gray-600"
                }`}
            >
              <Settings className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              <span className="text-base font-medium">Settings</span>
            </div>
          </Link>
        </div>
      </nav>
    </aside>
  )
}