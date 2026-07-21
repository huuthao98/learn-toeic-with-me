import Link from 'next/link';
import {
  GraduationCap,
  ChevronRight,
  CheckCircle,
  Briefcase,
  BookOpen,
  Target,
  Globe,
  Play,
  Star,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TeachersSection } from '@/components/feature/TeachersSection';

function Hero() {
  return (
    <section
      className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gray-50"
      aria-label="Giới thiệu"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <Badge className="bg-[#C8982A]/10 text-[#C8982A] hover:bg-[#C8982A]/20 border-0 mb-6 py-1.5 p-4 text-sm font-semibold uppercase tracking-wider rounded-sm">
              Học viện ngôn ngữ hàng đầu
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-[#0F2356] leading-[1.1] tracking-tight mb-6">
              Làm Chủ Ngôn Ngữ. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8982A] to-[#D4AF37]">
                Kiến Tạo Sự Nghiệp.
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed font-light">
              Hệ thống đào tạo Tiếng Anh và Tiếng Trung chuyên sâu. Chinh phục
              chứng chỉ quốc tế TOEIC, HSK và tự tin bước vào môi trường làm
              việc toàn cầu với kỹ năng phỏng vấn thực chiến.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="bg-[#0F2356] hover:bg-[#0a1840] text-white h-14 px-8 text-lg rounded-sm flex items-center gap-2 group transition-all">
                Bắt Đầu Ngay
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                className="h-14 px-8 text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-[#0F2356] rounded-sm transition-all flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                Tìm Hiểu Lộ Trình
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-sm text-gray-500 font-medium">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 overflow-hidden"
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${i + 10}&backgroundColor=f3f4f6`}
                      alt={`Học viên ${i}`}
                    />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-2 border-white bg-[#0F2356] flex items-center justify-center text-xs font-bold text-white">
                  5k+
                </div>
              </div>
              <p>Đã tham gia học trong tháng này</p>
            </div>
          </div>

          <div className="relative lg:h-[600px] flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-[4/5] rounded-tl-[100px] rounded-br-[100px] overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Học viên đang học ngoại ngữ tại LearnEverything"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F2356]/80 to-transparent flex items-end p-8">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-lg w-full text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <Star className="w-5 h-5 text-[#C8982A] fill-[#C8982A]" />
                    <span className="font-bold text-lg">Học viên xuất sắc</span>
                  </div>
                  <p className="text-sm text-white/90">
                    "Khóa học HSK đã giúp mình nhận học bổng toàn phần tại ĐH
                    Thanh Hoa."
                  </p>
                  <p className="text-xs text-white/70 mt-2">
                    — Nguyễn Trần Minh Anh
                  </p>
                </div>
              </div>
            </div>

            <div
              className="absolute top-10 -left-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 animate-bounce"
              style={{ animationDuration: '3s' }}
            >
              <div className="bg-blue-100 p-3 rounded-full text-[#0F2356]">
                <Globe className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Chứng chỉ
                </p>
                <p className="font-bold text-[#0F2356]">TOEIC &amp; HSK</p>
              </div>
            </div>

            <div
              className="absolute bottom-32 -right-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-4 animate-bounce"
              style={{ animationDuration: '4s', animationDelay: '1s' }}
            >
              <div className="bg-green-100 p-3 rounded-full text-green-700">
                <Target className="w-6 h-6" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase">
                  Tỷ lệ đậu
                </p>
                <p className="font-bold text-[#0F2356]">98.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const stats = [
    { value: '50,000+', label: 'Học Viên Tốt Nghiệp' },
    { value: '98%', label: 'Tỷ Lệ Đạt Mục Tiêu' },
    { value: '150+', label: 'Giảng Viên Cấp Cao' },
    { value: '4.9/5', label: 'Đánh Giá Trung Bình' },
  ];

  return (
    <section className="py-12 bg-[#0F2356] text-white" aria-label="Thống kê">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 md:divide-x divide-white/20">
          {stats.map((stat, index) => (
            <div key={index} className="text-center px-4">
              <p className="text-4xl lg:text-5xl font-bold text-[#C8982A] mb-2">
                {stat.value}
              </p>
              <p className="text-sm md:text-base text-gray-300 font-medium uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      title: 'Học Từ Vựng',
      desc: 'Lộ trình chuẩn Châu Âu. Cải thiện vốn từ vựng đa dạng qua phương pháp học lặp lại ngắt quãng.',
      icon: <BookOpen className="w-8 h-8" aria-hidden="true" />,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      href: '/practice/vocabulary',
    },
    {
      title: 'Luyện Phỏng Vấn AI',
      desc: 'Mô phỏng phỏng vấn thực tế với AI và chuyên gia nhân sự. Tăng sự tự tin vượt bậc.',
      icon: <Briefcase className="w-8 h-8" aria-hidden="true" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      href: '/practice/interview',
    },
    {
      title: 'Thi Thử TOEIC',
      desc: 'Hệ thống thi thử mô phỏng 100% định dạng đề thi thật. Cập nhật liên tục đề mới nhất.',
      icon: <Globe className="w-8 h-8" aria-hidden="true" />,
      color: 'text-red-600',
      bg: 'bg-red-50',
      href: '/practice/toeic',
    },
  ];

  return (
    <section
      id="courses"
      className="py-24 bg-white relative"
      aria-label="Chương trình đào tạo"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-sm font-bold tracking-widest text-[#C8982A] uppercase mb-3">
            Chương Trình Đào Tạo
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F2356] mb-6">
            Nền Tảng Vững Chắc Cho Tương Lai Khác Biệt
          </h2>
          <p className="text-gray-600 text-lg">
            Chúng tôi thiết kế các khóa học khắt khe nhưng mang lại kết quả xứng
            đáng. Đạt chuẩn quốc tế ngay tại Việt Nam.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {features.map((feat, idx) => (
            <Card
              key={idx}
              className="border-gray-100 shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer h-full"
            >
              <CardContent className="p-8 h-full flex flex-col">
                <div
                  className={`w-16 h-16 rounded-xl ${feat.bg} ${feat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                >
                  {feat.icon}
                </div>
                <h3 className="text-xl font-bold text-[#0F2356] mb-4">
                  {feat.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed flex-1">
                  {feat.desc}
                </p>
                <Link
                  href={feat.href}
                  className="inline-flex items-center text-[#C8982A] font-semibold group-hover:text-[#0F2356] transition-colors"
                >
                  Khám phá lộ trình
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div id="exams" className="mt-24 space-y-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 relative rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Phòng thi TOEIC chuẩn quốc tế tại LearnEverything"
                className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-[#0F2356]/20 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>
            <div className="order-1 md:order-2">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0 mb-4 rounded-sm">
                Chứng Chỉ Quốc Tế
              </Badge>
              <h2 className="text-3xl font-bold text-[#0F2356] mb-4">
                Hệ Thống Thi Thử TOEIC Độc Quyền
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Trải nghiệm không gian phòng thi chuẩn quốc tế qua hệ thống thi
                thử mô phỏng 100% định dạng đề thi thật. Cập nhật liên tục đề
                thi mới nhất từ ETS.
              </p>
              <ul className="space-y-4 mb-8" role="list">
                {[
                  'Đánh giá chi tiết từng kỹ năng',
                  'Gợi ý lộ trình cải thiện điểm số',
                  'Bảng xếp hạng năng lực toàn quốc',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center text-gray-700 font-medium"
                  >
                    <CheckCircle
                      className="w-5 h-5 text-[#C8982A] mr-3 shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/practice/toeic"
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'bg-white border-2 border-[#0F2356] text-[#0F2356] hover:bg-[#0F2356] hover:text-white rounded-sm h-12 px-6 transition-all',
                )}
              >
                Đăng Ký Thi Thử Miễn Phí
              </Link>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0 mb-4 rounded-sm">
                Kỹ Năng Thực Chiến
              </Badge>
              <h2 className="text-3xl font-bold text-[#0F2356] mb-4">
                Luyện Phỏng Vấn Chuyên Sâu Cùng AI
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                Không chỉ dạy ngôn ngữ, chúng tôi dạy cách bạn tỏa sáng trong
                các buổi phỏng vấn tập đoàn đa quốc gia. Luyện tập với hệ thống
                AI giả lập các HR khó tính nhất.
              </p>
              <ul className="space-y-4 mb-8" role="list">
                {[
                  'Bộ câu hỏi phỏng vấn theo 50+ ngành nghề',
                  'Phân tích phản xạ và ngữ điệu tự động',
                  'Nhận xét trực tiếp từ chuyên gia Headhunter',
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center text-gray-700 font-medium"
                  >
                    <CheckCircle
                      className="w-5 h-5 text-[#C8982A] mr-3 shrink-0"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/practice/interview"
                className={cn(
                  buttonVariants({ variant: 'default' }),
                  'bg-[#0F2356] hover:bg-[#0a1840] text-white rounded-sm h-12 px-6 transition-all',
                )}
              >
                Trải Nghiệm AI Interview
              </Link>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Luyện phỏng vấn chuyên nghiệp với AI tại LearnEverything"
                className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-[#0F2356]/20 group-hover:bg-transparent transition-colors duration-500"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    {
      num: '01',
      title: 'Đánh Giá Năng Lực',
      desc: 'Bài kiểm tra đầu vào toàn diện 4 kỹ năng để xác định chính xác trình độ hiện tại.',
    },
    {
      num: '02',
      title: 'Cá Nhân Hóa Lộ Trình',
      desc: 'Thiết kế kế hoạch học tập độc bản dựa trên mục tiêu điểm số và thời gian của bạn.',
    },
    {
      num: '03',
      title: 'Đào Tạo Chuyên Sâu',
      desc: 'Học tập dưới sự hướng dẫn của giảng viên chuyên gia và hệ thống học liệu độc quyền.',
    },
    {
      num: '04',
      title: 'Cam Kết Đầu Ra',
      desc: 'Đạt mục tiêu chứng chỉ hoặc được học lại miễn phí 100% đến khi hoàn thành.',
    },
  ];

  return (
    <section
      className="py-24 bg-gray-50 border-y border-gray-200"
      aria-label="Quy trình học tập"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-[#0F2356] mb-4">
            Lộ Trình Thành Công Chuẩn Mực
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Phương pháp giảng dạy được kiểm chứng bởi hàng chục ngàn học viên
            xuất sắc.
          </p>
        </div>
        <div className="grid md:grid-cols-4 gap-8 relative">
          <div
            className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-gray-200 z-0"
            aria-hidden="true"
          ></div>
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative z-10 text-center md:text-left flex flex-col items-center md:items-start"
            >
              <div className="w-24 h-24 bg-white border-4 border-gray-100 rounded-full flex items-center justify-center text-3xl font-black text-[#0F2356] mb-6 shadow-sm">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-[#0F2356] mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const reviews = [
    {
      name: 'Trần Đăng Khoa',
      role: 'Sinh viên ĐH Ngoại Thương',
      content:
        'Chương trình ôn luyện TOEIC ở đây cực kỳ khắc nghiệt nhưng hiệu quả. Mình tăng từ 550 lên 890 chỉ sau 3 tháng. Giảng viên hỗ trợ 24/7.',
      score: 'TOEIC 890',
    },
    {
      name: 'Lê Ngọc Diệp',
      role: 'Nhân viên Marketing, Shopee',
      content:
        'Tính năng luyện phỏng vấn tiếng Anh bằng AI thực sự là cứu cánh. Nhờ quen với các câu hỏi hóc búa, mình đã tự tin pass vòng phỏng vấn cuối.',
      score: 'IELTS 7.5',
    },
    {
      name: 'Phạm Hoàng Nam',
      role: 'Quản lý Dự án, FPT Software',
      content:
        'Môi trường học tập chuyên nghiệp, tài liệu bám sát đề thi thực tế. Đội ngũ giáo viên bản ngữ có chuyên môn sư phạm xuất sắc.',
      score: 'TOEIC 910',
    },
  ];

  return (
    <section
      id="testimonials"
      className="py-24 bg-[#0F2356]"
      aria-label="Đánh giá học viên"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <p className="text-[#C8982A] font-bold tracking-widest uppercase mb-2">
              Câu Chuyện Thành Công
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Minh Chứng Từ Sự Nỗ Lực
            </h2>
          </div>
          <Button
            variant="link"
            className="text-white hover:text-[#C8982A] px-0 h-auto font-medium text-lg flex items-center gap-2"
          >
            Xem tất cả đánh giá
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, idx) => (
            <Card
              key={idx}
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
            >
              <CardContent className="p-8">
                <div
                  className="flex text-[#C8982A] mb-6"
                  role="img"
                  aria-label="5 sao"
                >
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 fill-current"
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="text-gray-300 text-lg mb-8 italic">
                  "{review.content}"
                </blockquote>
                <div className="flex items-center justify-between border-t border-white/10 pt-6">
                  <div>
                    <p className="font-bold text-white">{review.name}</p>
                    <p className="text-gray-400 text-sm">{review.role}</p>
                  </div>
                  <Badge className="bg-[#C8982A] text-white border-0">
                    {review.score}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24 bg-white" aria-label="Đăng ký học">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#0F2356] to-[#1a3882] rounded-3xl p-10 md:p-16 text-center shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none"
            aria-hidden="true"
          >
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C8982A] rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Bắt Đầu Hành Trình Của Bạn Ngay Hôm Nay
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              Đăng ký ngay để nhận bài kiểm tra năng lực toàn diện miễn phí và
              lộ trình học tập cá nhân hóa từ chuyên gia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-[#C8982A] hover:bg-[#b08524] text-white h-14 px-10 text-lg rounded-sm font-semibold transition-all shadow-lg hover:shadow-xl">
                Tạo Tài Khoản Miễn Phí
              </Button>
              <Button
                variant="outline"
                className="h-14 px-10 text-lg border-white/30 hover:bg-white/10 rounded-sm font-semibold transition-all"
              >
                Liên Hệ Tư Vấn
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="bg-gray-950 text-gray-400 py-16 border-t border-gray-900"
      aria-label="Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center">
                <GraduationCap
                  className="text-white w-5 h-5"
                  aria-hidden="true"
                />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                LearnEverything<span className="text-[#C8982A]">.</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Học viện ngôn ngữ chuyên sâu hàng đầu Việt Nam. Nâng tầm tri thức,
              kiến tạo tương lai toàn cầu.
            </p>
          </div>
          <nav aria-label="Chương trình học">
            <h3 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">
              Chương Trình
            </h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Tiếng Anh Giao Tiếp
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Luyện Thi TOEIC
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Luyện Phỏng Vấn AI
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Tiếng Anh Cho Người Đi Làm
                </a>
              </li>
            </ul>
          </nav>
          <nav aria-label="Tài nguyên">
            <h3 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">
              Tài Nguyên
            </h3>
            <ul className="space-y-4 text-sm">
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Thư Viện Đề Thi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Cẩm Nang Học Tập
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Sự Kiện &amp; Hội Thảo
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-[#C8982A] transition-colors">
                  Blog Ngôn Ngữ
                </a>
              </li>
            </ul>
          </nav>
          <address className="not-italic">
            <h3 className="text-white font-semibold mb-6 uppercase text-sm tracking-wider">
              Liên Hệ
            </h3>
            <ul className="space-y-4 text-sm">
              <li>Tầng 15, Tòa nhà Vincom Center, Q.1, TP.HCM</li>
              <li>
                <a
                  href="mailto:hotro@LearnEverything.edu.vn"
                  className="hover:text-white transition-colors"
                >
                  hotro@LearnEverything.edu.vn
                </a>
              </li>
              <li>
                <a
                  href="tel:19001234"
                  className="hover:text-white transition-colors"
                >
                  1900 1234 56
                </a>
              </li>
            </ul>
          </address>
        </div>
        <div className="pt-8 border-t border-gray-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} LearnEverything Academy. All rights
            reserved.
          </p>
          <nav className="flex items-center gap-6" aria-label="Chính sách">
            <a href="#" className="hover:text-white transition-colors">
              Điều khoản
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Bảo mật
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Chính sách
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div
      className="w-screen relative left-[50%] -translate-x-1/2 bg-white text-gray-900"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      <main>
        <Hero />
        <Stats />
        <Features />
        <Process />
        <TeachersSection />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
