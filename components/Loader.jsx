"use client"
// components/Loader.js
import React from 'react';

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full border-8 border-t-8 border-gray-200 border-t-primary h-16 w-16"></div>
    </div>
  );
};

export default Loader;
