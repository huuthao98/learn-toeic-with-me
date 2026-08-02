'use client';

import {
  Eye,
  Mail,
  Phone,
  EyeOff,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  KeyRound,
} from 'lucide-react';
import * as z from 'zod';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  Card,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';

// Form Validation Schemas
const emailLoginSchema = z.object({
  email: z.string().email({ message: 'Email không hợp lệ' }),
  password: z.string().min(6, { message: 'Mật khẩu phải tối thiểu 6 ký tự' }),
});

const phoneLoginSchema = z.object({
  phone: z.string().min(10, { message: 'Số điện thoại không hợp lệ (tối thiểu 10 số)' }),
  otp: z.string().optional(),
});

type EmailLoginFormValues = z.infer<typeof emailLoginSchema>;
type PhoneLoginFormValues = z.infer<typeof phoneLoginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { useLoginMutation, useFirebasePhoneMutation } = useAuth();
  const { isAuthenticated, token } = useAuthStore();
  const loginMutation = useLoginMutation();
  const phoneMutation = useFirebasePhoneMutation();

  const [otpSent, setOtpSent] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('email');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated && token) {
      router.push(ROUTES.DASHBOARD);
    }
  }, [isAuthenticated, token, router]);

  const emailForm = useForm<EmailLoginFormValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const phoneForm = useForm<PhoneLoginFormValues>({
    resolver: zodResolver(phoneLoginSchema),
    defaultValues: {
      phone: '',
      otp: '',
    },
  });

  // Email Submit Handler
  const onEmailSubmit = (values: EmailLoginFormValues) => {
    loginMutation.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          toast.success('Đăng nhập thành công!');
          router.push(ROUTES.DASHBOARD);
        },
        onError: (err: any) => {
          toast.error(
            err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.',
          );
        },
      },
    );
  };

  // Phone Send OTP / Submit Handler
  const onPhoneSubmit = (values: PhoneLoginFormValues) => {
    if (!otpSent) {
      // Simulate sending OTP
      setOtpSent(true);
      return;
    }

    if (!values.otp || values.otp.length !== 6) {
      phoneForm.setError('otp', { message: 'Mã OTP gồm 6 ký tự' });
      return;
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
          toast.success('Đăng nhập thành công!');
          router.push(ROUTES.DASHBOARD);
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Xác thực số điện thoại thất bại.');
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center lg:grid lg:grid-cols-12 overflow-hidden px-4 sm:px-0">
      <style>{`
        @property --btn-loading-stop {
          syntax: '<percentage>';
          inherits: false;
          initial-value: 0%;
        }
        @keyframes loading-gradient-shift {
          0% { --btn-loading-stop: 0%; }
          100% { --btn-loading-stop: 100%; }
        }
        .btn-loading-animated {
          background: linear-gradient(135deg, #00a3ff var(--btn-loading-stop), #06f 45%, #003cc8 100%) !important;
          animation: loading-gradient-shift 3s ease-in-out alternate infinite;
        }
      `}</style>
      {/* Brand Column (Left) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-slate-900 text-white items-center min-h-screen w-full flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(13,148,136,0.15),transparent_50%)] pointer-events-none" />

        <div className="w-full flex items-center gap-2 relative z-10">
          <Link
            href={ROUTES.HOME}
            className="text-2xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-300"
          >
            Learn Everything
          </Link>
        </div>

        <div className="max-w-md my-auto">
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
            Kiên trì mỗi ngày
          </h1>
          <p className="text-slate-400 text-lg mb-8">
            Thành công không đến từ sự ngẫu nhiên, mà từ nỗ lực bền bỉ. Hãy biến việc học thành thói
            quen hàng ngày để xây dựng nền tảng vững chắc và tự tin đạt mục tiêu của bạn.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-sm">Luyện tập không ngừng nghỉ</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Kho đề thi phong phú, cập nhật liên tục giúp bạn duy trì nhịp độ học tập và cọ xát
                  với cấu trúc đề thực tế mỗi ngày.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-semibold text-sm">Ghi nhận mọi nỗ lực của bạn</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Đo lường sự tiến bộ, theo dõi chuỗi ngày học tập liên tục (streak) để tiếp thêm
                  động lực trên chặng đường chinh phục điểm số.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full text-slate-500 text-xs flex justify-between">
          <span>© 2026 Learn Everything Inc.</span>
          <span>Hỗ trợ kỹ thuật: support@learneverything.vn</span>
        </div>
      </div>

      {/* Login Column (Right) */}
      <div className="w-full lg:col-span-6 xl:col-span-5 flex items-center justify-center py-12">
        <Card className="w-full max-w-md mx-auto border-none shadow-none bg-transparent sm:bg-card sm:border sm:border-border sm:shadow-lg sm:p-4 glass-card">
          <CardHeader className="text-center sm:text-left">
            <CardTitle className="text-2xl font-bold tracking-tight">Chào mừng trở lại</CardTitle>
            <CardDescription>Đăng nhập vào hệ thống để tiếp tục quá trình học tập.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* <TabsList className="grid w-full grid-cols-2 mb-6 relative h-10">
                <div
                  className={`absolute top-[3px] bottom-[3px] left-[3px] w-[calc(50%-3px)] rounded-md bg-background shadow-sm dark:bg-input/30 dark:border dark:border-input ${
                    activeTab === 'phone' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                  style={{
                    transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
                <TabsTrigger
                  value="email"
                  className="flex items-center gap-2 z-10 text-foreground/70 data-active:!text-foreground !bg-transparent !shadow-none !border-none"
                  style={{
                    transition: 'color 380ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Mail className="h-4 w-4" />
                  <span>Email</span>
                </TabsTrigger>
                <TabsTrigger
                  value="phone"
                  className="flex items-center gap-2 z-10 text-foreground/70 data-active:!text-foreground !bg-transparent !shadow-none !border-none"
                  style={{
                    transition: 'color 380ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  <Phone className="h-4 w-4" />
                  <span>Số điện thoại</span>
                </TabsTrigger>
              </TabsList> */}

              <div className="min-h-[295px] w-full overflow-hidden relative">
                <div
                  className="flex w-[200%] transition-transform"
                  style={{
                    transform: activeTab === 'phone' ? 'translateX(-50%)' : 'translateX(0%)',
                    transition: 'transform 380ms cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {/* Email Login Form */}
                  <div
                    className={`w-1/2 shrink-0 px-0.5 ${activeTab === 'email' ? 'pointer-events-auto' : 'pointer-events-none select-none'}`}
                  >
                    <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Địa chỉ Email
                        </label>
                        <div className="relative m-2">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="ten@vidu.com"
                            className="pl-9"
                            disabled={loginMutation.isPending}
                            {...emailForm.register('email')}
                          />
                        </div>
                        {emailForm.formState.errors.email && (
                          <p className="text-xs text-destructive font-medium">
                            {emailForm.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Mật khẩu
                          </label>
                          <Link
                            href="#"
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Quên mật khẩu?
                          </Link>
                        </div>
                        <div className="relative m-2">
                          <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-9 pr-9"
                            disabled={loginMutation.isPending}
                            {...emailForm.register('password')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {emailForm.formState.errors.password && (
                          <p className="text-xs text-destructive font-medium">
                            {emailForm.formState.errors.password.message}
                          </p>
                        )}
                      </div>

                      <Button
                        type="submit"
                        className={`w-full h-11 mt-2 border-0 text-white font-semibold transition-all duration-200 ${
                          loginMutation.isPending
                            ? 'btn-loading-animated disabled:opacity-100 disabled:pointer-events-none'
                            : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md'
                        }`}
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? 'Đang đăng nhập...' : 'Đăng Nhập'}
                      </Button>
                    </form>
                  </div>

                  {/* Phone Login Form */}
                  <div
                    className={`w-1/2 shrink-0 px-0.5 ${activeTab === 'phone' ? 'pointer-events-auto' : 'pointer-events-none select-none'}`}
                  >
                    <form onSubmit={phoneForm.handleSubmit(onPhoneSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase">
                          Số điện thoại
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="tel"
                            placeholder="09xxxxxxxx"
                            className="pl-9"
                            disabled={otpSent || phoneMutation.isPending}
                            {...phoneForm.register('phone')}
                          />
                        </div>
                        {phoneForm.formState.errors.phone && (
                          <p className="text-xs text-destructive font-medium">
                            {phoneForm.formState.errors.phone.message}
                          </p>
                        )}
                      </div>

                      {otpSent && (
                        <div className="space-y-2 animate-fade-in">
                          <label className="text-xs font-semibold text-muted-foreground uppercase">
                            Mã xác thực OTP
                          </label>
                          <Input
                            type="text"
                            placeholder="Nhập 6 số OTP (ví dụ: 123456)"
                            disabled={phoneMutation.isPending}
                            {...phoneForm.register('otp')}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Nhập mã bất kỳ để tiếp tục giả lập.
                          </p>
                          {phoneForm.formState.errors.otp && (
                            <p className="text-xs text-destructive font-medium">
                              {phoneForm.formState.errors.otp.message}
                            </p>
                          )}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className={`w-full h-11 mt-4 border-0 text-white font-semibold transition-all duration-200 ${
                          phoneMutation.isPending
                            ? 'btn-loading-animated disabled:opacity-100 disabled:pointer-events-none'
                            : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 shadow-md'
                        }`}
                        disabled={phoneMutation.isPending}
                      >
                        {phoneMutation.isPending
                          ? 'Đang xác thực...'
                          : otpSent
                            ? 'Xác Nhận OTP & Đăng Nhập'
                            : 'Gửi Mã Xác Thực OTP'}
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
                  </div>
                </div>
              </div>
            </Tabs>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 text-center bg-white">
            <div className="text-sm">
              Chưa có tài khoản?{' '}
              <Link href={ROUTES.REGISTER} className="font-semibold text-primary hover:underline">
                Đăng ký ngay
              </Link>
            </div>
            {/* Direct Admin Login Helper for convenience */}
            {/* <div className="pt-4 border-t border-border/40 w-full flex items-center justify-center gap-2">
              <span className="text-[10px] text-muted-foreground">
                Dùng thử nhanh tài khoản admin:
              </span>
              <button
                onClick={() => {
                  emailForm.setValue('email', 'admin@example.com');
                  emailForm.setValue('password', '123456');
                }}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Nhập tài khoản Admin
              </button>
            </div> */}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
