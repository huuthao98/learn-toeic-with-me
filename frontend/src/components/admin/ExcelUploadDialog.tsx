import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuestions } from '@/hooks/useQuestions';

export function ExcelUploadDialog({
  isOpen,
  onClose,
  testSetId,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  testSetId: string;
  onSuccess?: (msg: string) => void;
}) {
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isUploadingExcel, setIsUploadingExcel] = useState(false);
  const { useUpsertQuestionsMutation } = useQuestions();
  const upsertQuestionsMutation = useUpsertQuestionsMutation();

  const downloadInterviewTemplate = () => {
    const instructions = [
      ['HƯỚNG DẪN NHẬP CÂU HỎI PHỎNG VẤN'],
      ['1. File này dùng để đẩy câu hỏi phỏng vấn (tự luận).'],
      [
        '2. Các cột bắt buộc:  "Số thứ tự câu (question number)", "Câu hỏi (question)", Câu trả lời (answer), "Giải thích (explanation)".',
      ],
    ];

    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    wsInstructions['!cols'] = [{ wch: 80 }];

    const data = [
      {
        'Số thứ tự câu': 1,
        'Câu hỏi': 'Event Loop là gì?',
        'Câu trả lời mẫu':
          'Event Loop là cơ chế giúp Node.js / Browser xử lý các tác vụ bất đồng bộ...',
        'Giải thích': 'Tham khảo thêm ở MDN Web Docs.',
      },
    ];

    const wsData = XLSX.utils.json_to_sheet(data);
    wsData['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 50 }, { wch: 50 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Hướng Dẫn');
    XLSX.utils.book_append_sheet(wb, wsData, 'Template Nhập Liệu');
    XLSX.writeFile(wb, 'Interview_Template.xlsx');
  };

  const handleExcelUpload = () => {
    if (!excelFile) return;
    setIsUploadingExcel(true);
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName =
        workbook.SheetNames.find(n => n.includes('Template')) ||
        workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet) as any[];

      const questionsToUpsert = parsedData
        .map(row => {
          const usedKeys = new Set<string>();
          const getVal = (searchKeys: string[]) => {
            const k = Object.keys(row).find(
              key =>
                !usedKeys.has(key) &&
                searchKeys.some(sk =>
                  key.toLowerCase().includes(sk.toLowerCase()),
                ),
            );
            if (k) usedKeys.add(k);
            return k ? row[k] : undefined;
          };

          const qNumRaw = getVal(['số thứ tự', 'question number', 'câu số']);
          const questionRaw = getVal(['câu hỏi', 'question']);
          const answerRaw = getVal(['câu trả lời', 'answer']);
          const expRaw = getVal(['giải thích', 'explanation']);

          const qNum = parseInt(String(qNumRaw), 10);

          return {
            questionNumber: qNum,
            questionText: questionRaw || '',
            correctAnswer: answerRaw || 'TEXT',
            explanation: expRaw || '',
            isActive: true,
          };
        })
        .filter(
          q =>
            !isNaN(q.questionNumber) &&
            q.questionText !== undefined &&
            String(q.questionText).trim() !== '',
        );

      if (questionsToUpsert.length === 0) {
        setIsUploadingExcel(false);
        alert('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      upsertQuestionsMutation.mutate(
        { testSetId, questions: questionsToUpsert },
        {
          onSuccess: () => {
            setIsUploadingExcel(false);
            setExcelFile(null);
            onSuccess?.(
              `Đã tải file Excel thành công (${questionsToUpsert.length} câu).`,
            );
            onClose();
          },
          onError: () => {
            setIsUploadingExcel(false);
            alert('Lỗi khi tải file Excel.');
          },
        },
      );
    };
    reader.readAsBinaryString(excelFile);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bổ sung câu hỏi từ Excel</DialogTitle>
          <DialogDescription>
            Tải lên file Excel mẫu để thêm nhiều câu hỏi cùng lúc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
            <span className="text-sm font-medium">Chưa có file mẫu?</span>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadInterviewTemplate}
            >
              Tải Template Phỏng Vấn
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">File Excel (.xlsx)</label>
            <Input
              type="file"
              accept=".xlsx, .xls"
              onChange={e => setExcelFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUploadingExcel}
          >
            Hủy
          </Button>
          <Button
            disabled={!excelFile || isUploadingExcel}
            onClick={handleExcelUpload}
          >
            {isUploadingExcel ? 'Đang xử lý...' : 'Tải lên'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
