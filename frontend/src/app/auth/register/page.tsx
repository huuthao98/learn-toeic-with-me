"use client"

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
import { KeyRound, Mail, Phone, User, Sparkles, BookOpen, AlertCircle, ArrowRight, Calendar, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"

// Zod Validation Schemas
const emailRegisterSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  fullName: z.string().min(2, { message: "Họ và tên phải có tối thiểu 2 ký tự" }),
  age: z.string().min(1, "Vui lòng nhập tuổi").refine((val) => !isNaN(Number(val)) && Number(val) >= 6, { message: "Tuổi phải là số từ 6 trở lên" }),
  password: z.string().min(6, { message: "Mật khẩu phải tối thiểu 6 ký tự" }),
})

const phoneRegisterSchema = z.object({
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ" }),
  fullName: z.string().min(2, { message: "Họ và tên phải có tối thiểu 2 ký tự" }),
  age: z.string().min(1, "Vui lòng nhập tuổi").refine((val) => !isNaN(Number(val)) && Number(val) >= 6, { message: "Tuổi phải là số từ 6 trở lên" }),
  otp: z.string().optional(),
})

type EmailRegisterFormValues = z.infer<typeof emailRegisterSchema>
type PhoneRegisterFormValues = z.infer<typeof phoneRegisterSchema>

export default function RegisterPage() {
  const router = useRouter()
  const { useRegisterMutation, useFirebasePhoneMutation } = useAuth()
  const { isAuthenticated, token } = useAuthStore()
  const registerMutation = useRegisterMutation()
  const phoneMutation = useFirebasePhoneMutation()

  const [otpSent, setOtpSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && token) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, token, router])

  const emailForm = useForm<EmailRegisterFormValues>({
    resolver: zodResolver(emailRegisterSchema),
    defaultValues: {
      email: "",
      fullName: "",
      age: "",
      password: "",
    },
  })

  const phoneForm = useForm<PhoneRegisterFormValues>({
    resolver: zodResolver(phoneRegisterSchema),
    defaultValues: {
      phone: "",
      fullName: "",
      age: "",
      otp: "",
    },
  })

  // Watch password to show password strength
  const passwordVal = emailForm.watch("password")
  useEffect(() => {
    if (!passwordVal) {
      setPasswordStrength(0)
      return
    }
    let strength = 0
    if (passwordVal.length >= 6) strength += 1
    if (passwordVal.length >= 10) strength += 1
    if (/[A-Z]/.test(passwordVal)) strength += 1
    if (/[0-9]/.test(passwordVal)) strength += 1
    setPasswordStrength(strength)
  }, [passwordVal])

  // Email Register Submit
  const onEmailSubmit = (values: EmailRegisterFormValues) => {
    setErrorMsg(null)
    registerMutation.mutate(
      {
        email: values.email,
        fullName: values.fullName,
        age: Number(values.age),
        password: values.password,
      },
      {
        onSuccess: () => {
          router.push("/dashboard")
        },
        onError: (err: any) => {
          setErrorMsg(err.response?.data?.message || "Đăng ký tài khoản thất bại. Email có thể đã tồn tại.")
        },
      }
    )
  }

  // Phone Register Submit (Simulated Firebase Verification)
  const onPhoneSubmit = (values: PhoneRegisterFormValues) => {
    setErrorMsg(null)
    if (!otpSent) {
      setOtpSent(true)
      return
    }

    if (!values.otp || values.otp.length !== 6) {
      phoneForm.setError("otp", { message: "Mã OTP gồm 6 ký tự" })
      return
    }

    phoneMutation.mutate(
      {
        token: `mock_firebase_otp_token_${values.otp}_${Date.now()}_${values.phone}`,
        fullName: values.fullName,
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

  const getStrengthLabel = (strength: number) => {
    if (strength === 0) return { label: "", color: "bg-slate-200" }
    if (strength <= 2) return { label: "Yếu", color: "bg-rose-500" }
    if (strength === 3) return { label: "Trung bình", color: "bg-amber-500" }
    return { label: "Mạnh", color: "bg-emerald-500" }
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
            Khởi động hành trình chinh phục <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300">TOEIC 990</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Tạo tài khoản miễn phí để nhận báo cáo lộ trình học tập, thống kê điểm số và luyện tập các câu hỏi Incomplete Sentences mỗi ngày.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <Calendar className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-sm">Điểm danh học tập mỗi ngày</h4>
                <p className="text-xs text-slate-400 mt-1">Duy trì Streak liên tục giúp củng cố kiến thức và thói quen làm bài thi.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-sm">Luyện đề thi thử trực quan</h4>
                <p className="text-xs text-slate-400 mt-1">Giao diện làm bài thi y hệt thực tế cùng cơ chế tính điểm chuẩn.</p>
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

      {/* Register Column (Right) */}
      <div className="w-full lg:col-span-6 xl:col-span-5 flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent sm:bg-card sm:border sm:border-border sm:shadow-lg sm:p-2 glass-card">
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-2xl font-bold tracking-tight">Tạo tài khoản mới</CardTitle>
            <CardDescription>Bắt đầu hành trình ôn tập TOEIC của bạn ngay hôm nay.</CardDescription>
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

              {/* Email Register Form */}
              <TabsContent value="email">
                <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                    {/* Full Name */}
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Nguyễn Văn A"
                          className="pl-9"
                          disabled={registerMutation.isPending}
                          {...emailForm.register("fullName")}
                        />
                      </div>
                      {emailForm.formState.errors.fullName && (
                        <p className="text-[10px] text-destructive font-medium">{emailForm.formState.errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Age */}
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Tuổi</label>
                      <Input
                        type="number"
                        placeholder="20"
                        disabled={registerMutation.isPending}
                        {...emailForm.register("age")}
                      />
                      {emailForm.formState.errors.age && (
                        <p className="text-[10px] text-destructive font-medium">{emailForm.formState.errors.age.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="ten@vidu.com"
                        className="pl-9"
                        disabled={registerMutation.isPending}
                        {...emailForm.register("email")}
                      />
                    </div>
                    {emailForm.formState.errors.email && (
                      <p className="text-[10px] text-destructive font-medium">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Mật khẩu</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="pl-9"
                        disabled={registerMutation.isPending}
                        {...emailForm.register("password")}
                      />
                    </div>
                    {emailForm.formState.errors.password && (
                      <p className="text-[10px] text-destructive font-medium">{emailForm.formState.errors.password.message}</p>
                    )}

                    {/* Password Strength Indicator */}
                    {passwordVal && (
                      <div className="mt-2 space-y-1.5 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px] font-semibold text-muted-foreground">
                          <span>Độ mạnh mật khẩu</span>
                          <span className="font-bold">{getStrengthLabel(passwordStrength).label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getStrengthLabel(passwordStrength).color}`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full mt-4" disabled={registerMutation.isPending}>
                    {registerMutation.isPending ? "Đang xử lý..." : "Tạo Tài Khoản Bằng Email"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </form>
              </TabsContent>

              {/* Phone Register Form */}
              <TabsContent value="phone">
                <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-3">
                  <div className="grid grid-cols-12 gap-3">
                    {/* Full Name */}
                    <div className="col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Họ và tên</label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Nguyễn Văn A"
                          className="pl-9"
                          disabled={otpSent || phoneMutation.isPending}
                          {...phoneForm.register("fullName")}
                        />
                      </div>
                      {phoneForm.formState.errors.fullName && (
                        <p className="text-[10px] text-destructive font-medium">{phoneForm.formState.errors.fullName.message}</p>
                      )}
                    </div>

                    {/* Age */}
                    <div className="col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Tuổi</label>
                      <Input
                        type="number"
                        placeholder="20"
                        disabled={otpSent || phoneMutation.isPending}
                        {...phoneForm.register("age")}
                      />
                      {phoneForm.formState.errors.age && (
                        <p className="text-[10px] text-destructive font-medium">{phoneForm.formState.errors.age.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Số điện thoại</label>
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
                      <p className="text-[10px] text-destructive font-medium">{phoneForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {otpSent && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Mã xác thực OTP</label>
                      <Input
                        type="text"
                        placeholder="Nhập 6 số OTP (ví dụ: 123456)"
                        disabled={phoneMutation.isPending}
                        {...phoneForm.register("otp")}
                      />
                      <p className="text-[10px] text-muted-foreground">Nhập mã bất kỳ để tiếp tục giả lập xác thực.</p>
                      {phoneForm.formState.errors.otp && (
                        <p className="text-[10px] text-destructive font-medium">{phoneForm.formState.errors.otp.message}</p>
                      )}
                    </div>
                  )}

                  <Button type="submit" className="w-full mt-4" disabled={phoneMutation.isPending}>
                    {phoneMutation.isPending
                      ? "Đang xử lý..."
                      : otpSent
                        ? "Xác Nhận OTP & Đăng Ký"
                        : "Gửi Mã Xác Thực OTP"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>

                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs font-medium text-primary hover:underline block text-center mx-auto"
                    >
                      Thay đổi số điện thoại / thông tin
                    </button>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter className="text-center justify-center">
            <div className="text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                Đăng nhập
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
