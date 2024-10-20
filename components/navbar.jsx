"use client"
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-primary p-4">
      <div className="container mx-auto flex justify-between">
        <div className="text-white text-lg font-bold">
          Infrastructure Funds Management
        </div>
        <div className="space-x-4">
          <Link href="/" className="text-white hover:bg-gray-700 px-3 py-2 rounded">Home</Link>
          <Link href="/projects" className="text-white hover:bg-gray-700 px-3 py-2 rounded">Projects</Link>
          <Link href="/reports" className="text-white hover:bg-gray-700 px-3 py-2 rounded">Reports</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
