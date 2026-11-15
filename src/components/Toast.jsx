import React from 'react';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] transition-all duration-200">
      <div className="bg-[#1E1E1E] border border-[#2E2E2E] text-white px-4 py-3 rounded flex items-center gap-3 shadow-none">
        <CheckCircleOutlineIcon className="text-[#7E57C2]" fontSize="small" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

