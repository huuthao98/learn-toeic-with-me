'use client';

import { useState } from 'react';
import { CategorySelection } from './CategorySelection';
import { TestSetList } from './TestSetList';

export function VocabularyPracticeFeature() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelectCategory = (category: string) => {
    setSelectedCategory(category);
  };

  if (!selectedCategory) {
    return <CategorySelection onSelectCategory={handleSelectCategory} />;
  }

  return (
    <TestSetList
      selectedCategory={selectedCategory}
      onBack={() => setSelectedCategory(null)}
    />
  );
}
