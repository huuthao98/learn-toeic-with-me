'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronDown, GraduationCap, Menu, X } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  getListPracticeB1Route,
  getListPracticeToeicRoute,
  ROUTES,
} from '@/constants/routes';

export function HomeHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setPracticeOpen(false);
    setExamOpen(false);
  };

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
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
              <GraduationCap className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary tracking-tight">
              LearnEverything<span className="text-ring">.</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Điều hướng chính">
            <Popover>
              <PopoverTrigger className="text-gray-600 hover:text-primary font-medium transition-colors flex items-center gap-1">
                Luyện Tập
                <ChevronDown className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex flex-col gap-1">
                  <Link
                    href={ROUTES.PRACTICE_VOCABULARY}
                    className="px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                  >
                    Luyện Từ Vựng
                  </Link>
                  <Link
                    href={ROUTES.PRACTICE_INTERVIEW}
                    className="px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                  >
                    Luyện Phỏng Vấn
                  </Link>
                  <Link
                    href={getListPracticeToeicRoute('practice')}
                    className="px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                  >
                    Luyện Thi TOEIC
                  </Link>
                  <Link
                    href={getListPracticeB1Route('practice')}
                    className="px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                  >
                    Luyện Thi B1
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger className="text-gray-600 hover:text-primary font-medium transition-colors flex items-center gap-1">
                Thi Thử
                <ChevronDown className="w-4 h-4" />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="flex flex-col gap-1">
                  <Link
                    href={getListPracticeToeicRoute('exam')}
                    className="px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                  >
                    Thi Thử TOEIC
                  </Link>
                  <Link
                    href={getListPracticeB1Route('exam')}
                    className="px-3 py-2 hover:bg-muted rounded-md text-sm font-medium transition-colors"
                  >
                    Thi Thử B1
                  </Link>
                </div>
              </PopoverContent>
            </Popover>

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

          {/* Desktop Auth */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-4">
              {mounted && isAuthenticated ? (
                <Link
                  href={ROUTES.DASHBOARD}
                  className="bg-primary hover:bg-primary/90 text-white rounded-sm px-6 h-11 text-base transition-all flex items-center"
                >
                  Bảng điều khiển
                </Link>
              ) : (
                <>
                  <Link
                    href={ROUTES.LOGIN}
                    className="text-primary font-medium hover:text-ring transition-colors"
                  >
                    Đăng Nhập
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className="bg-primary hover:bg-primary/90 text-white rounded-sm px-6 h-11 text-base transition-all flex items-center"
                  >
                    Đăng Ký Miễn Phí
                  </Link>
                </>
              )}
            </div>

            {/* Hamburger */}
            <button
              className="lg:hidden text-gray-900 p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-lg">
          <div className="flex flex-col px-4 py-2">
            {/* Luyện Tập accordion */}
            <button
              className="flex justify-between items-center w-full text-left text-base font-medium text-gray-800 py-3 border-b border-gray-100"
              onClick={() => setPracticeOpen(!practiceOpen)}
              aria-expanded={practiceOpen}
            >
              Luyện Tập
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  practiceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {practiceOpen && (
              <div className="flex flex-col pl-4 pb-2 gap-1 border-b border-gray-100">
                <Link
                  href={ROUTES.PRACTICE_VOCABULARY}
                  onClick={closeMobileMenu}
                  className="text-sm text-gray-600 font-medium py-2 hover:text-primary transition-colors"
                >
                  Luyện Từ Vựng
                </Link>
                <Link
                  href={ROUTES.PRACTICE_INTERVIEW}
                  onClick={closeMobileMenu}
                  className="text-sm text-gray-600 font-medium py-2 hover:text-primary transition-colors"
                >
                  Luyện Phỏng Vấn
                </Link>
                <Link
                  href={getListPracticeToeicRoute('practice')}
                  onClick={closeMobileMenu}
                  className="text-sm text-gray-600 font-medium py-2 hover:text-primary transition-colors"
                >
                  Luyện Thi TOEIC
                </Link>
                <Link
                  href={getListPracticeB1Route('practice')}
                  onClick={closeMobileMenu}
                  className="text-sm text-gray-600 font-medium py-2 hover:text-primary transition-colors"
                >
                  Luyện Thi B1
                </Link>
              </div>
            )}

            {/* Thi Thử accordion */}
            <button
              className="flex justify-between items-center w-full text-left text-base font-medium text-gray-800 py-3 border-b border-gray-100"
              onClick={() => setExamOpen(!examOpen)}
              aria-expanded={examOpen}
            >
              Thi Thử
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  examOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {examOpen && (
              <div className="flex flex-col pl-4 pb-2 gap-1 border-b border-gray-100">
                <Link
                  href={getListPracticeToeicRoute('exam')}
                  onClick={closeMobileMenu}
                  className="text-sm text-gray-600 font-medium py-2 hover:text-primary transition-colors"
                >
                  Thi Thử TOEIC
                </Link>
                <Link
                  href={getListPracticeB1Route('exam')}
                  onClick={closeMobileMenu}
                  className="text-sm text-gray-600 font-medium py-2 hover:text-primary transition-colors"
                >
                  Thi Thử B1
                </Link>
              </div>
            )}

            {/* Anchor links */}
            <a
              href="#teachers"
              onClick={closeMobileMenu}
              className="text-base font-medium text-gray-800 py-3 border-b border-gray-100 hover:text-primary transition-colors"
            >
              Giảng Viên
            </a>
            <a
              href="#testimonials"
              onClick={closeMobileMenu}
              className="text-base font-medium text-gray-800 py-3 border-b border-gray-100 hover:text-primary transition-colors"
            >
              Thành Tích
            </a>

            {/* Auth CTA */}
            <div className="pt-3 pb-2">
              {mounted && isAuthenticated ? (
                <Link href={ROUTES.DASHBOARD} onClick={closeMobileMenu}>
                  <Button className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base rounded-sm">
                    Bảng điều khiển
                  </Button>
                </Link>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href={ROUTES.LOGIN} onClick={closeMobileMenu}>
                    <Button
                      variant="outline"
                      className="w-full h-11 text-base rounded-sm border-primary text-primary hover:bg-primary/5"
                    >
                      Đăng Nhập
                    </Button>
                  </Link>
                  <Link href={ROUTES.REGISTER} onClick={closeMobileMenu}>
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white h-11 text-base rounded-sm">
                      Đăng Ký Miễn Phí
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
