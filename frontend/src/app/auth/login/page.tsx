"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/hooks/useAuth"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { KeyRound, Mail, Phone, Sparkles, BookOpen, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react"

// Form Validation Schemas
const emailLoginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().min(6, { message: "Mật khẩu phải tối thiểu 6 ký tự" }),
})

const phoneLoginSchema = z.object({
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ (tối thiểu 10 số)" }),
  otp: z.string().optional(),
})

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>
type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { useLoginMutation, useFirebasePhoneMutation } = useAuth()
  const { isAuthenticated, token } = useAuthStore()
  const loginMutation = useLoginMutation()
  const phoneMutation = useFirebasePhoneMutation()

  const [otpSent, setOtpSent] = React.useState(false)
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null)

  // Redirect to dashboard if already logged in
  React.useEffect(() => {
    if (isAuthenticated && token) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, token, router])

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const phoneForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: "",
      otp: "",
    },
  })

  // Email Submit Handler
  const onEmailSubmit = (values: EmailLoginFormValues) => {
    setErrorMsg(null)
    loginMutation.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          router.push("/dashboard")
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.")
        },
      }
    )
  }

  // Phone Send OTP / Submit Handler
  const onPhoneSubmit = (values: PhoneLoginFormValues) => {
    setErrorMsg(null)
    if (!otpSent) {
      // Simulate sending OTP
      setOtpSent(true)
      return
    }

    if (!values.otp || values.otp.length !== 6) {
      phoneForm.setError("otp", { message: "Mã OTP gồm 6 ký tự" })
      return
    }

    // Call verify Firebase Token. In a real environment, you use the Firebase JS SDK
    // to authenticate, get an ID Token, and send it. Here we simulate/mock it.
    phoneMutation.mutate(
      {
        token: `mock_firebase_otp_token_${values.otp}_${Date.now()}_${values.phone}`,
        fullName: `Học Viên SĐT ${values.phone.slice(-4)}`,
      },
      {
        onSuccess: () => {
          router.push("/dashboard")
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || "Xác thực số điện thoại thất bại.")
        },
      }
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center lg:grid lg:grid-cols-12 overflow-hidden px-4 sm:px-0">
      
      {/* Brand Column (Left) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-slate-900 text-white min-h-screen flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,148,136,0.15),transparent_50%)]" />
        
        {/* Brand Header */}
        <div className="flex items-center gap-2 relative z-10">
          <span className="p-2 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="font-bold text-2xl tracking-tight">LearnTOEIC</span>
        </div>

        {/* Feature Presentation */}
        <div className="max-w-md relative z-10 my-auto">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Nâng tầm điểm số <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">TOEIC Reading</span> của bạn
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Học thông minh, thi hiệu quả. Hệ thống hóa lộ trình học, theo dõi chuỗi ngày chuyên cần và luyện đề thực tế chuẩn cấu trúc đề thi 2026.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-sm">Thư viện đề thi phong phú</h4>
                <p className="text-xs text-slate-400 mt-1">Hàng trăm đề luyện thi được phân nhóm theo năm và cập nhật liên tục.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-sm">Báo cáo tiến trình thông minh</h4>
                <p className="text-xs text-slate-400 mt-1">Phân tích kết quả thi, chấm điểm tự động và tính toán chuỗi chuyên cần học tập.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-slate-500 text-xs relative z-10 flex justify-between">
          <span>© 2026 LearnTOEIC Inc.</span>
          <span>Hỗ trợ kỹ thuật: support@learntoeic.vn</span>
        </div>
      </div>

      {/* Login Column (Right) */}
      <div className="w-full lg:col-span-6 xl:col-span-5 flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent sm:bg-card sm:border sm:border-border sm:shadow-lg sm:p-2 glass-card">
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-2xl font-bold tracking-tight">Chào mừng trở lại</CardTitle>
            <CardDescription>Đăng nhập vào hệ thống để tiếp tục quá trình học tập.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Global Error Banner */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>Số điện thoại</span>
                </TabsTrigger>
              </TabsList>

              {/* Email Login Form */}
              <TabsContent value="email">
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="ten@vidu.com"
                        className="pl-9"
                        disabled={loginMutation.isPending}
                        {...emailForm.register("email")}
                      />
                    </div>
                    {emailForm.formState.errors.email && (
                      <p className="text-xs text-destructive font-medium">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Mật khẩu</label>
                      <Link href="#" className="text-xs font-medium text-primary hover:underline">Quên mật khẩu?</Link>
                    </div>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        disabled={loginMutation.isPending}
                        {...emailForm.register("password")}
                      />
                    </div>
                    {emailForm.formState.errors.password && (
                      <p className="text-xs text-destructive font-medium">{emailForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-4" disabled={loginMutation.isPending}>
                    {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng Nhập Bằng Email"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Login Form */}
              <TabsContent value="phone">
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="09xxxxxxxx"
                        className="pl-9"
                        disabled={otpSent || phoneMutation.isPending}
                        {...phoneForm.register("phone")}
                      />
                    </div>
                    {phoneForm.formState.errors.phone && (
                      <p className="text-xs text-destructive font-medium">{phoneForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {otpSent && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Mã xác thực OTP</label>
                      <Input
                        type="text"
                        placeholder="Nhập 6 số OTP (ví dụ: 123456)"
                        disabled={phoneMutation.isPending}
                        {...phoneForm.register("otp")}
                      />
                      <p className="text-[10px] text-muted-foreground">Nhập mã bất kỳ để tiếp tục giả lập.</p>
                      {phoneForm.formState.errors.otp && (
                        <p className="text-xs text-destructive font-medium">{phoneForm.formState.errors.otp.message}</p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full mt-4" disabled={phoneMutation.isPending}>
                    {phoneMutation.isPending
                      ? "Đang xác thực..."
                      : otpSent
                      ? "Xác Nhận OTP & Đăng Nhập"
                      : "Gửi Mã Xác Thực OTP"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-medium text-primary hover:underline block text-center mx-auto"
                    >
                      Thay đổi số điện thoại
                    </button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col gap-4 text-center">
            <div className="text-sm text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link href="/auth/register" className="font-semibold text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </div>
            {/* Direct Admin Login Helper for convenience */}
            <div className="pt-4 border-t border-border/40 w-full flex items-center justify-center gap-2">
              <span className="text-[10px] text-muted-foreground">Dùng thử nhanh tài khoản admin:</span>
              <button
                onClick={() => {
                  emailForm.setValue("email", "admin@example.com")
                  emailForm.setValue("password", "123456")
                }}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Nhập tài khoản Admin
              </button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
