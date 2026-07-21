'use client';

import { useState, useEffect } from 'react';
import { GraduationCap, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function HeaderDetail() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-sm border-gray-200 shadow-sm py-3'
          : 'bg-white border-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          <Link href={'/practice'} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">
              LearnEverything<span className="text-ring">.</span>
            </span>
          </Link>

          <nav
            className="hidden md:flex items-center gap-8"
            aria-label="Điều hướng chính"
          >
            <a
              href="#courses"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Khóa Học
            </a>
            <a
              href="#exams"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Thi Thử
            </a>
            <a
              href="#teachers"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Giảng Viên
            </a>
            <a
              href="#testimonials"
              className="text-gray-600 hover:text-primary font-medium transition-colors"
            >
              Thành Tích
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <a
                href="/auth/login"
                className="text-primary font-medium hover:text-ring transition-colors"
              >
                Đăng Nhập
              </a>
              <Link
                href={'/auth/register'}
                className="bg-primary hover:bg-primary/90 text-white rounded-sm px-6 h-11 text-base transition-all flex items-center"
              >
                Đăng Ký Miễn Phí
              </Link>
            </div>
            <button
              className="md:hidden text-gray-900 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Mở menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg py-4 px-4 flex flex-col gap-4">
          <a
            href="#courses"
            className="text-lg font-medium text-gray-800 py-2 border-b"
          >
            Khóa Học
          </a>
          <a
            href="#exams"
            className="text-lg font-medium text-gray-800 py-2 border-b"
          >
            Thi Thử
          </a>
          <a
            href="#teachers"
            className="text-lg font-medium text-gray-800 py-2 border-b"
          >
            Giảng Viên
          </a>
          <a
            href="#testimonials"
            className="text-lg font-medium text-gray-800 py-2 border-b"
          >
            Thành Tích
          </a>
          <Button className="w-full bg-primary hover:bg-[#0a1840] text-white mt-4 h-12 text-lg rounded-sm">
            Đăng Ký Miễn Phí
          </Button>
        </div>
      )}
    </header>
  );
}
