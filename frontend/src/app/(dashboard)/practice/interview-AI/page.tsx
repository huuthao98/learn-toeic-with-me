'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  MessageSquare,
  User,
  Bot,
  Settings,
  PlayCircle,
} from 'lucide-react';

export default function PracticeInterviewPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const toggleRecording = () => setIsRecording(!isRecording);

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <Bot className="h-8 w-8 text-indigo-500 animate-bounce" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                Luyện tập Phỏng vấn AI
              </span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Nâng cao kỹ năng giao tiếp tiếng Anh qua các tình huống phỏng vấn
              thực tế.
            </p>
          </div>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Cài đặt
          </Button>
        </div>

        {/* Main Content: Video Call & Chat */}
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left Panel: Video Area */}
          <div className="flex-1 flex flex-col gap-4">
            {/* AI Interviewer Video */}
            <Card className="flex-1 overflow-hidden relative border-0 shadow-lg bg-slate-900 ring-1 ring-white/10 group">
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950">
                {/* Simulated AI Avatar */}
                <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)]">
                    <Bot className="w-16 h-16 text-white" />
                  </div>
                  {/* Speaking indicator */}
                  <div className="absolute -inset-4 border-2 border-indigo-500/50 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                </div>
                <h3 className="text-white mt-6 font-medium text-lg">
                  Sarah - AI HR Manager
                </h3>
                <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  Đang phân tích câu trả lời...
                </p>
              </div>

              {/* User Video Overlay (Picture-in-Picture) */}
              <div className="absolute bottom-6 right-6 w-48 h-64 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl transition-transform hover:scale-105">
                {videoOn ? (
                  <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-500" />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white backdrop-blur-sm">
                      Bạn
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center flex-col gap-2">
                    <VideoOff className="w-8 h-8 text-slate-500" />
                    <span className="text-xs text-slate-500">Camera Tắt</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Controls Bar */}
            <Card className="p-4 flex items-center justify-center gap-6 bg-background/50 backdrop-blur-lg border-border/50">
              <Button
                variant={micOn ? 'outline' : 'destructive'}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => setMicOn(!micOn)}
              >
                {micOn ? (
                  <Mic className="w-5 h-5" />
                ) : (
                  <MicOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant={videoOn ? 'outline' : 'destructive'}
                size="icon"
                className="rounded-full w-12 h-12"
                onClick={() => setVideoOn(!videoOn)}
              >
                {videoOn ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <VideoOff className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant={isRecording ? 'destructive' : 'default'}
                className={`rounded-full px-8 h-12 gap-2 font-bold transition-all ${isRecording ? 'animate-pulse bg-red-500 hover:bg-red-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    Đang Ghi Âm...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Bắt đầu trả lời
                  </>
                )}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="rounded-full w-12 h-12 ml-4"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </Card>
          </div>

          {/* Right Panel: Transcript & Questions */}
          <Card className="w-96 flex flex-col overflow-hidden border-border/50 bg-background/50 backdrop-blur-md">
            <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                Nội dung phỏng vấn
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Question */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                  <Bot className="w-4 h-4" />
                  Sarah (AI HR)
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-2xl rounded-tl-none border border-indigo-100 dark:border-indigo-900/50 text-sm">
                  <p className="font-medium text-foreground">
                    Could you tell me about a time when you had to overcome a
                    significant challenge at work?
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Hãy kể cho tôi nghe về một lần bạn phải vượt qua một thử
                    thách lớn trong công việc?
                  </p>
                </div>
              </div>

              {/* User Answer (Simulated) */}
              {isRecording && (
                <div className="space-y-2 flex flex-col items-end">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    Bạn
                    <User className="w-4 h-4" />
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl rounded-tr-none border border-emerald-100 dark:border-emerald-900/50 text-sm max-w-[90%]">
                    <div className="flex items-center gap-1 mb-1">
                      <span className="flex gap-0.5 h-3 items-center">
                        <span
                          className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <span
                          className="w-1 h-2 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <span
                          className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </span>
                      <span className="text-xs text-emerald-600/70 ml-1">
                        Đang nghe...
                      </span>
                    </div>
                    <p className="text-foreground/80">
                      Yes, in my previous role as a project manager, we faced a
                      sudden budget cut...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Feedback/Suggestions Panel */}
            <div className="p-4 border-t border-border/50 bg-muted/10">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Gợi ý trả lời
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="p-2 rounded-lg bg-background border border-border hover:border-indigo-500/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                  💡 Sử dụng phương pháp STAR (Situation, Task, Action, Result)
                </li>
                <li className="p-2 rounded-lg bg-background border border-border hover:border-indigo-500/50 transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
                  💡 Nhấn mạnh vào kỹ năng giải quyết vấn đề của bạn
                </li>
              </ul>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
