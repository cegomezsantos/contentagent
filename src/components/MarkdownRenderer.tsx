'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const formatMarkdown = (text: string): string => {
    return text
      // Encabezados
      .replace(/^### (.+$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2 text-gray-800">$1</h3>')
      .replace(/^## (.+$)/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-gray-900">$1</h2>')
      .replace(/^# (.+$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>')
      
      // Texto en negrita
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      .replace(/__(.+?)__/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      
      // Texto en cursiva
      .replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>')
      .replace(/_(.+?)_/g, '<em class="italic text-gray-800">$1</em>')
      
      // Listas con viñetas
      .replace(/^[\s]*[-\*\+] (.+$)/gm, '<li class="ml-4 mb-1 text-gray-700 list-disc list-inside">$1</li>')
      
      // Listas numeradas
      .replace(/^[\s]*\d+\. (.+$)/gm, '<li class="ml-4 mb-1 text-gray-700 list-decimal list-inside">$1</li>')
      
      // Código inline
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">$1</code>')
      
      // Saltos de línea
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700">')
      .replace(/\n/g, '<br />');
  };

  const formattedContent = formatMarkdown(content);

  return (
    <div 
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ 
        __html: `<p class="mb-4 text-gray-700">${formattedContent}</p>` 
      }}
    />
  );
};

export default MarkdownRenderer; 