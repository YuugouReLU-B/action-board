"use client";

import { useEffect, useState } from "react";
import { markLevelUpSeenAction } from "@/features/user-level/actions/level-up";
import { LevelUpDialog } from "@/features/user-level/components/level-up-dialog";
import { ProgressBarAnimated } from "@/features/user-level/components/progress-bar-animated";
import {
  calculateLevel,
  getXpToNextLevel,
  totalXp,
} from "@/features/user-level/utils/level-calculator";

interface XpProgressToastContentProps {
  initialXp: number;
  xpGained: number;
  onLevelUp?: (newLevel: number) => void;
  onAnimationComplete: () => void;
}

export function XpProgressToastContent({
  initialXp,
  xpGained,
  onLevelUp,
  onAnimationComplete,
}: XpProgressToastContentProps) {
  const [showFinalState, setShowFinalState] = useState(false);
  const [levelState, setLevelState] = useState({
    currentLevel: calculateLevel(initialXp),
    currentXp: initialXp,
    currentXpGained: xpGained,
  });

  // XPアニメーション関連の状態
  const [levelUpData, setLevelUpData] = useState<{
    newLevel: number;
    pointsToNextLevel: number;
  } | null>(null);

  // アニメーション完了後、3秒でToast閉じ
  useEffect(() => {
    if (showFinalState) {
      const timer = setTimeout(() => {
        onAnimationComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showFinalState, onAnimationComplete]);

  // 現在のレベルでの進捗を計算
  const { currentLevel, currentXp, currentXpGained } = levelState;
  const currentLevelStartXp = totalXp(currentLevel);
  const nextLevelTotalXp = totalXp(currentLevel + 1);
  const startXp = currentXp;
  const endXp =
    startXp + currentXpGained > nextLevelTotalXp
      ? nextLevelTotalXp
      : startXp + currentXpGained;
  const pointsToNextLevel = getXpToNextLevel(endXp);

  // レベルアップ処理
  const handleLevelUp = (newLevel: number) => {
    // 次の次のレベルまで上がるならそのままアニメーション継続
    const newNextLevelXp = totalXp(newLevel + 1);
    if (startXp + currentXpGained > newNextLevelXp) {
      const xpUsed = endXp - startXp;
      setLevelState({
        currentLevel: newLevel,
        currentXp: endXp,
        currentXpGained: currentXpGained - xpUsed,
      });
      return;
    }

    if (onLevelUp) {
      onLevelUp(newLevel);
    }
    setLevelUpData({
      newLevel,
      pointsToNextLevel,
    });
  };

  // レベルアップダイアログを閉じる
  const handleLevelUpDialogClose = async () => {
    setLevelUpData(null);

    // レベルアップ通知を確認済みとしてマーク
    try {
      const result = await markLevelUpSeenAction();
      if (!result.success) {
        console.error(
          "Failed to mark level up notification as seen:",
          result.error,
        );
      }
    } catch (error) {
      console.error("Error marking level up notification as seen:", error);
    }

    const xpUsed = endXp - startXp;
    setLevelState({
      currentLevel: levelState.currentLevel + 1,
      currentXp: endXp,
      currentXpGained: currentXpGained - xpUsed,
    });
  };

  return (
    <>
      <div className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            {xpGained}P獲得しました！
          </h3>
        </div>

        <ProgressBarAnimated
          zeroValue={currentLevelStartXp}
          maxValue={nextLevelTotalXp}
          startValue={startXp}
          endValue={endXp}
          className="mb-4"
          showText={false}
          animationDuration={1000}
          onAnimationComplete={() => {
            if (endXp >= nextLevelTotalXp) {
              const newLevel = currentLevel + 1;
              handleLevelUp(newLevel);
            } else {
              setShowFinalState(true);
            }
          }}
        />

        <div className="text-center">
          <div className="text-xs text-gray-500">
            レベル {currentLevel}
            {showFinalState && (
              <span> • 次のレベルまで{pointsToNextLevel}P</span>
            )}
          </div>
        </div>
      </div>

      {levelUpData && (
        <LevelUpDialog
          isOpen={levelUpData !== null}
          onClose={handleLevelUpDialogClose}
          newLevel={levelUpData.newLevel}
        />
      )}
    </>
  );
}
