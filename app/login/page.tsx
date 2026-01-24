"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocale } from "@/lib/locale-context"
import { Lock, Mail, AlertCircle, Info } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const router = useRouter()
  const { t } = useLocale()
  const { authUsers, setCurrentAuthUserId } = useAppStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const user = authUsers.find((u) => u.email === email)
      if (!user) {
        setError(t("invalidCredentials"))
        setIsLoading(false)
        return
      }

      // Hash password for comparison (simple base64 for demo)
      const passwordHash = Buffer.from(password).toString("base64")
      if (user.passwordHash !== passwordHash) {
        setError(t("invalidCredentials"))
        setIsLoading(false)
        return
      }

      setCurrentAuthUserId(user.id)
      router.push("/")
    } catch (err) {
      setError(t("loginError"))
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="Logo" className="h-24 w-24 object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">INTERLAG</CardTitle>
          <CardDescription>{t("loginTitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("loggingIn") : t("login")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
