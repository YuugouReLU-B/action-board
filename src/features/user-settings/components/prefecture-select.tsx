"use client";

import type React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PREFECTURE_NOT_SELECTED,
  PREFECTURES,
} from "@/lib/constants/prefectures";

type PrefectureSelectProps = {
  name: string;
  id?: string;
  defaultValue?: string;
  required?: boolean;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  placeholder?: string;
};

export const PrefectureSelect: React.FC<PrefectureSelectProps> = ({
  name,
  id,
  defaultValue,
  required,
  disabled,
  onValueChange,
  placeholder = "都道府県を選択",
}) => {
  return (
    <Select
      name={name}
      defaultValue={defaultValue || PREFECTURE_NOT_SELECTED}
      required={required}
      disabled={disabled}
      onValueChange={onValueChange}
    >
      <SelectTrigger id={id || name}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {/* 未選択のまま送信されると、フォーム用の hidden な select が
            先頭の選択肢（北海道）を送ってしまう。明示的な「選択しない」を
            先頭に置いて、意図しない都道府県が保存されるのを防ぐ */}
        <SelectItem value={PREFECTURE_NOT_SELECTED}>選択しない</SelectItem>
        {PREFECTURES.map((pref) => (
          <SelectItem value={pref} key={pref}>
            {pref}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
