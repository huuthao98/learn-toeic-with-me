'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function TeachersSection() {
  const [currentIndex, setCurrentIndex] = useState(2);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const teachers = [
    {
      name: 'ThS. Nguyễn Văn A',
      degree: 'Thạc sĩ',
      major: 'Ngôn ngữ học',
      role: 'Chuyên gia luyện thi TOEIC',
      image:
        'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Hơn 10 năm kinh nghiệm, cựu giám khảo kỳ thi chứng chỉ quốc tế. Đã giúp hàng ngàn học viên đạt mục tiêu.',
      score: 'TOEIC 990',
      tags: ['TOEIC', 'Listening', 'Reading'],
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Cô Trần Thị B',
      degree: 'Thạc sĩ',
      major: 'TESOL',
      role: 'Giảng viên Tiếng Anh Giao Tiếp',
      image:
        'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Thạc sĩ TESOL Đại học Victoria, phương pháp dạy lôi cuốn, tạo động lực mạnh mẽ cho học viên mất gốc.',
      score: 'IELTS 8.5',
      tags: ['Giao tiếp', 'Phát âm'],
      color: 'from-pink-500 to-rose-500',
    },
    {
      name: 'Mr. John Smith',
      degree: 'Cử nhân',
      major: 'Quản trị nhân sự',
      role: 'Chuyên gia Phỏng Vấn AI',
      image:
        'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Cựu HR Manager tại các tập đoàn đa quốc gia. Cung cấp những góc nhìn thực tế nhất để chinh phục nhà tuyển dụng.',
      score: 'Senior HR',
      tags: ['Interview', 'Business'],
      color: 'from-amber-500 to-orange-500',
    },
    {
      name: 'Cô Phạm Minh D',
      degree: 'Thạc sĩ',
      major: 'Phương pháp giảng dạy Tiếng Anh',
      role: 'Giảng viên IELTS',
      image:
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Chuyên trị các kĩ năng Speaking & Writing. Phương pháp giảng dạy khoa học, bám sát tiêu chí chấm thi.',
      score: 'IELTS 8.5',
      tags: ['IELTS', 'Speaking', 'Writing'],
      color: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Thầy Hoàng Nam',
      degree: 'Tiến sĩ',
      major: 'Ngôn ngữ học',
      role: 'Giảng viên Tiếng Trung',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Tiến sĩ Ngôn ngữ học Đại học Bắc Kinh. Phương pháp nhớ chữ Hán độc quyền qua phương pháp chiết tự.',
      score: 'HSK 6',
      tags: ['Tiếng Trung', 'HSK'],
      color: 'from-red-500 to-rose-600',
    },
    {
      name: 'Cô Lê Hoàng Yến',
      degree: 'Thạc sĩ',
      major: 'Biên phiên dịch',
      role: 'Chuyên gia luyện dịch thuật',
      image:
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Hơn 8 năm kinh nghiệm biên phiên dịch cabin cho hội nghị quốc tế cấp cao. Truyền đạt bí quyết dịch thuật đỉnh cao.',
      score: 'IELTS 9.0',
      tags: ['Dịch thuật', 'Advanced'],
      color: 'from-purple-500 to-indigo-500',
    },
    {
      name: 'Thầy David Clark',
      degree: 'Thạc sĩ',
      major: 'Văn học Anh',
      role: 'Giảng viên Tiếng Anh Cơ Bản',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
      description:
        'Giảng viên bản ngữ với 5 năm giảng dạy tại Việt Nam. Giúp học viên vượt qua rào cản ngôn ngữ một cách tự nhiên.',
      score: 'Native Speaker',
      tags: ['Cơ bản', 'Giao tiếp'],
      color: 'from-violet-500 to-fuchsia-500',
    },
  ];

  const itemsPerPage = isMobile ? 1 : 3;
  const maxIndex = Math.max(0, teachers.length - itemsPerPage);

  // Ensure index is within bounds when resizing
  if (currentIndex > maxIndex) {
    setCurrentIndex(maxIndex);
  }

  const handleNext = () => {
    if (currentIndex < maxIndex) setCurrentIndex(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const slidePercentage = isMobile ? 100 : 100 / itemsPerPage;
  const gapAdjustment = isMobile ? 24 : 24 / itemsPerPage;
  const translateX = `calc(-${currentIndex} * (${slidePercentage}% + ${gapAdjustment}px))`;

  return (
    <section
      id="teachers"
      className="py-24 bg-gray-50"
      aria-label="Đội ngũ giảng viên"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Title and Nav Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-6 relative">
          <div className="text-center flex-1">
            <p className="text-sm font-bold tracking-widest text-[#C8982A] uppercase mb-3">
              Đội ngũ chuyên gia
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F2356] mb-6">
              Những Người Dẫn Đường Tận Tâm
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Học hỏi từ những chuyên gia ngôn ngữ hàng đầu, giàu kinh nghiệm
              thực chiến và tâm huyết với nghề.
            </p>
          </div>
        </div>

        {/* Slider Section */}
        <div className="relative group px-0 lg:px-12 flex items-center">
          <Button
            variant="outline"
            size="icon"
            className={`${currentIndex === 0 ? 'invisible' : ''} hidden md:flex shrink-0 rounded-full border-gray-300 w-14 h-14 text-[#0F2356] hover:bg-[#0F2356] hover:text-white transition-colors z-10`}
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          {/* Slider Container */}
          <div className="overflow-hidden py-4 px-2 mx-auto">
            <div
              className="flex transition-transform duration-500 ease-in-out gap-6"
              style={{ transform: `translateX(${translateX})` }}
            >
              {teachers.map((teacher, idx) => (
                <div
                  key={idx}
                  className="w-full md:w-[calc((100%-48px)/3)] shrink-0"
                >
                  <Card className="h-full flex flex-col bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 rounded-2xl overflow-hidden group hover:-translate-y-2">
                    {/* Avatar & Cover Section */}
                    <div className="relative pt-8 px-6 pb-2 flex flex-col items-center text-center">
                      <div
                        className={`absolute top-0 left-0 w-full h-24 bg-gradient-to-r ${teacher.color} opacity-10`}
                      />
                      <div className="relative mb-4">
                        <div
                          className={`absolute inset-0 bg-gradient-to-tr ${teacher.color} rounded-full blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-500`}
                        />
                        <img
                          src={teacher.image}
                          alt={teacher.name}
                          className="w-28 h-28 object-cover rounded-full border-4 border-white shadow-md relative z-10"
                        />
                      </div>
                      <Badge className="bg-[#0F2356] text-white hover:bg-[#0F2356] border-0 mb-3 text-[10px] font-bold uppercase tracking-wider px-3 py-1">
                        {teacher.score}
                      </Badge>
                      <h3 className="text-xl font-extrabold text-gray-900 mb-1">
                        {teacher.name}
                      </h3>
                      <p className="text-[#C8982A] font-bold text-sm mb-3">
                        {teacher.role}
                      </p>

                      <div className="flex gap-2 justify-center flex-wrap mb-2">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 border-0"
                        >
                          {teacher.degree}
                        </Badge>
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 border-0"
                        >
                          {teacher.major}
                        </Badge>
                      </div>
                    </div>

                    {/* Body Section */}
                    <CardContent className="px-6 pb-6 pt-2 flex flex-col flex-1">
                      <p className="text-gray-500 text-sm text-center leading-relaxed flex-1 mb-6">
                        "{teacher.description}"
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 justify-center mb-6">
                        {teacher.tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs font-semibold text-gray-500"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100">
                        <Button className="flex-1 bg-[#0F2356] hover:bg-[#0a1840] text-white rounded-xl shadow-md hover:shadow-lg transition-all h-11">
                          Xem hồ sơ
                        </Button>
                        {/* <Button variant="outline" size="icon" className="rounded-xl shrink-0 text-blue-600 border-gray-200 hover:bg-blue-50 h-11 w-11">
                        <Linkedin className="w-5 h-5" />
                      </Button> */}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className={`${currentIndex === maxIndex ? 'invisible' : ''} hidden md:flex shrink-0 rounded-full border-gray-300 w-14 h-14 text-[#0F2356] hover:bg-[#0F2356] hover:text-white transition-colors `}
            onClick={handleNext}
            disabled={currentIndex === maxIndex}
          >
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Mobile Navigation & Dots */}
        <div className="flex items-center justify-center mt-10 gap-6">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden rounded-full w-10 h-10 border-gray-300 text-gray-600"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          <div className="flex justify-center gap-2.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  currentIndex === i
                    ? 'bg-[#C8982A] w-8'
                    : 'bg-gray-300 hover:bg-gray-400 w-2.5'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="md:hidden rounded-full w-10 h-10 border-gray-300 text-gray-600"
            onClick={handleNext}
            disabled={currentIndex === maxIndex}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
