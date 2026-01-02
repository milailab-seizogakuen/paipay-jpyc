'use client';

import { useRef, useEffect, KeyboardEvent, ClipboardEvent } from 'react';
import type { CSSProperties } from 'react';

interface PINInputProps {
  value: string;
  onChange: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export default function PINInput({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
}: PINInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 最初の入力欄にフォーカス
  useEffect(() => {
    if (!disabled && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  // 4桁入力完了時
  useEffect(() => {
    if (value.length === 4 && onComplete) {
      onComplete(value);
    }
  }, [value, onComplete]);

  const handleChange = (index: number, digit: string) => {
    // 数字以外は無視
    if (!/^\d*$/.test(digit)) return;

    // valueを配列に変換（空文字列の場合も4桁ぶん用意）
    const newValue = value ? value.split('') : ['', '', '', ''];

    // 入力された最後の文字だけを使う（ペースト対策）
    newValue[index] = digit.slice(-1);

    const newPin = newValue.join('').slice(0, 4);

    onChange(newPin);

    // 次の入力欄にフォーカス
    if (digit && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();

      if (value[index]) {
        // 現在の桁を削除
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      } else if (index > 0) {
        // 前の桁にフォーカスして削除
        const newValue = value.split('');
        newValue[index - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 4);

    onChange(pastedData);

    // 最後の入力欄にフォーカス
    const focusIndex = Math.min(pastedData.length, 3);
    inputRefs.current[focusIndex]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((index) => (
        <input
          key={index}
          ref={(el) => {
            // ref コールバックは void を返す形に
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={`
            w-14 h-16 text-center text-2xl font-bold rounded-xl
            border-2 transition-all
            focus:outline-none focus:ring-2
            ${error
              ? 'border-red-500 bg-red-50 focus:ring-red-500'
              : 'border-gray-300 focus:border-red-500 focus:ring-red-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          style={
            {
              WebkitTextSecurity: value[index] ? 'disc' : 'none',
              MozTextSecurity: value[index] ? 'disc' : 'none',
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
